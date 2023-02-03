
// import { colourCommentHandler } from "./extension";
import { ESourceFormat, IExternalFeatures } from "./externalfeatures";
import { ISourceHandler, ICommentCallback, ISourceHandlerLite, commentRange } from "./language/isourcehandler";
import { getCOBOLKeywordDictionary } from "./language/keywords/cobolKeywords";
import { colourCommentHandler } from "./vscolourcomments";
import { VSCOBOLConfiguration } from "./vsconfiguration";
import { VSExternalFeatures } from "./vsexternalfeatures";

import * as path from "path";
import { URI } from 'vscode-uri';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentFilter, Range } from 'vscode-languageserver';
import { connection } from './instance';
import * as fileutils from './fileutils';

export class VSCodeSourceHandlerLite implements ISourceHandlerLite {
    document: TextDocument | undefined;
    lineCount: number;
    languageId: string;
    notedCommentRanges: commentRange[];

    public constructor(document: TextDocument) 
    {
        this.document = document;
        this.lineCount = this.document.lineCount;
        this.languageId = document.languageId;
        this.notedCommentRanges = [];
    }

    public getLineCount(): number {
        return this.lineCount;
    }

    getLanguageId(): string {
        return this.languageId;
    }

    getFilename(): string {
        if (this.document && this.document.uri) {
            const uri = URI.parse(this.document.uri);
            const basename = path.basename(uri.fsPath);
            return basename;
        }
        return "";
    }

    getRawLine(lineNumber: number): string | undefined {
        if (this.document === undefined || lineNumber >= this.lineCount) {
            return undefined;
        }
        const lineText = this.document.getText(Range.create(lineNumber, 0, lineNumber+1, 0));
        // TODO: handle line ends coming back in lineText

        return lineText === undefined ? undefined : lineText;
    }

    async getLineTabExpanded(lineNumber: number): Promise<string|undefined> {
        const unexpandedLine = this.getRawLine(lineNumber);
        if (unexpandedLine === undefined) {
            return undefined;
        }

        // do we have a tab?
        if (unexpandedLine.indexOf("\t") === -1) {
            return unexpandedLine;
        }

        const tabSize: number = (await connection.workspace.getConfiguration("editor.tabSize")) || 4;

        return unexpandedLine.replace(new RegExp(`\t`, `g`), ``.padEnd(tabSize));
    }


    getNotedComments(): commentRange[] {
        return this.notedCommentRanges;
    }
}

export class VSCodeSourceHandler implements ISourceHandler, ISourceHandlerLite {
    commentCount: number;
    document: TextDocument | undefined;
    dumpNumbersInAreaA: boolean;
    dumpAreaBOnwards: boolean;
    commentCallbacks: ICommentCallback[] = [];
    lineCount: number;
    // eslint-disable-next-line @typescript-eslint/ban-types
    documentVersionId: bigint;
    isSourceInWorkSpace: boolean;
    shortWorkspaceFilename: string;
    updatedSource: Map<number, string>;
    languageId: string;
    format: ESourceFormat;
    externalFeatures: IExternalFeatures;
    notedCommentRanges: commentRange[];

    public constructor(document: TextDocument) 
    {
        this.document = document;
        this.dumpNumbersInAreaA = false;
        this.dumpAreaBOnwards = false;
        this.commentCount = 0;
        this.lineCount = this.document.lineCount;
        this.documentVersionId = BigInt(this.document.version);
        this.languageId = document.languageId;
        this.format = ESourceFormat.unknown;
        this.externalFeatures = VSExternalFeatures;
        this.notedCommentRanges = [];
        const uri = URI.parse(document.uri);
        const workspaceFilename = await fileutils.getShortWorkspaceFilename(uri);
        this.shortWorkspaceFilename = workspaceFilename === undefined ? "" : workspaceFilename;
        this.isSourceInWorkSpace = this.shortWorkspaceFilename.length !== 0;
        this.updatedSource = new Map<number, string>();

        // if we cannot be trusted and the file is outside the workspace, dont read it
        if (!this.isSourceInWorkSpace) {
            this.clear();
        }

        if (this.isFileExcluded()) {
            this.clear();
        }

        this.addCommentCallback(colourCommentHandler);
    }

    private clear(): void {
        this.commentCallbacks = [];
        this.document = undefined;
        this.lineCount = 0;
    }
    
    private isFileExcluded(): boolean {
        const config = VSCOBOLConfiguration.get();

        if (this.document !== undefined) {
            if (this.document.lineCount > config.scan_line_limit) {
                this.externalFeatures.logMessage(`Aborted scanning ${this.shortWorkspaceFilename} after line limit of ${config.scan_line_limit} has been exceeded`);
                return true;
            }

            for (const fileEx of config.files_exclude) {
                const documentFilter: DocumentFilter = {
                    pattern: fileEx
                };
            }
        }

        return false;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    getDocumentVersionId(): bigint {
        return this.documentVersionId;
    }

    getUriAsString(): string {
        return this.document === undefined ? "" : this.document.uri.toString();
    }

    getLineCount(): number {
        return this.lineCount;
    }

    getCommentCount(): number {
        return this.commentCount;
    }

    private static paraPrefixRegex1 = /^[0-9 ][0-9 ][0-9 ][0-9 ][0-9 ][0-9 ]/g;

    private sendCommentCallback(line: string, lineNumber: number, startPos: number, format: ESourceFormat) {
        if (this.commentCallbacks !== undefined) {
            for (const commentCallback of this.commentCallbacks) {
                commentCallback.processComment(this, line, this.getFilename(), lineNumber, startPos, format);
            }
        }
    }

    getLine(lineNumber: number, raw: boolean): string | undefined {
        if (this.document === undefined || lineNumber >= this.lineCount) {
            return undefined;
        }

        let line = this.getRawLine(lineNumber);
        if (!line) return;

        if (raw) {
            return line;
        }

        const startComment = line.indexOf("*>");
        if (startComment !== -1) {
            this.commentCount++;
            this.sendCommentCallback(line, lineNumber, startComment, ESourceFormat.variable);
            line = line.substring(0, startComment);
        }

        // drop variable format line
        if (line.length > 1 && line[0] === "*") {
            this.commentCount++;
            this.sendCommentCallback(line, lineNumber,0, ESourceFormat.free);
            return "";
        }

        // drop fixed format line
        if (line.length >= 7 && (line[6] === "*" || line[6] === "/")) {
            this.commentCount++;
            this.sendCommentCallback(line, lineNumber,6, ESourceFormat.fixed);
            return "";
        }

        // handle debug and terminal
        if (this.format === ESourceFormat.terminal) {
            if (line.startsWith("\\D") || line.startsWith("|")) {
                this.commentCount++;
                this.sendCommentCallback(line, lineNumber,0, ESourceFormat.terminal);
                return "";
            }
        }

        // todo - this is a bit messy and should be revised
        if (this.dumpNumbersInAreaA) {
            if (line.match(VSCodeSourceHandler.paraPrefixRegex1)) {
                line = "      " + line.substring(6);
            } else {
                if (line.length > 7 && line[6] === " ") {
                    const possibleKeyword = line.substring(0, 6).trim();
                    if (this.isValidKeyword(possibleKeyword) === false) {
                        line = "       " + line.substring(6);
                    }
                }
            }
        }

        if (this.dumpAreaBOnwards && line.length >= 73) {
            line = line.substring(0, 72);
        }

        return line;
    }
    getRawLine(lineNumber: number): string | undefined {
        if (this.document === undefined || lineNumber >= this.lineCount) {
            return undefined;
        }
        const lineText = this.document.getText(Range.create(lineNumber, 0, lineNumber+1, 0));
        // TODO: handle line ends coming back in lineText

        return lineText === undefined ? undefined : lineText;
    }

    async getLineTabExpanded(lineNumber: number): Promise<string|undefined> {
        const unexpandedLine = this.getRawLine(lineNumber);
        if (unexpandedLine === undefined) {
            return undefined;
        }

        // do we have a tab?
        if (unexpandedLine.indexOf("\t") === -1) {
            return unexpandedLine;
        }

        const tabSize: number = (await connection.workspace.getConfiguration("editor.tabSize")) || 4;

        return unexpandedLine.replace(new RegExp(`\t`, `g`), ``.padEnd(tabSize));
    }

    setDumpAreaA(flag: boolean): void {
        this.dumpNumbersInAreaA = flag;
    }

    setDumpAreaBOnwards(flag: boolean): void {
        this.dumpAreaBOnwards = flag;
    }

    isValidKeyword(keyword: string): boolean {
        return getCOBOLKeywordDictionary(this.languageId).has(keyword);
    }

    getFilename(): string {
        if (this.document && this.document.uri) {
            const uri = URI.parse(this.document.uri);
            const basename = path.basename(uri.fsPath);
            return basename;
        }
        return "";
    }

    addCommentCallback(commentCallback: ICommentCallback): void {
        this.commentCallbacks.push(commentCallback);
    }

    resetCommentCount(): void {
        this.commentCount = 0;
    }

    getIsSourceInWorkSpace(): boolean {
        return this.isSourceInWorkSpace;
    }

    getShortWorkspaceFilename(): string {
        return this.shortWorkspaceFilename;
    }

    setUpdatedLine(lineNumber: number, line: string): void {
        this.updatedSource.set(lineNumber, line);
    }

    getUpdatedLine(linenumber: number): string | undefined {
        if (this.updatedSource.has(linenumber)) {
            return this.updatedSource.get(linenumber);
        }

        return this.getLine(linenumber, false);
    }

    getLanguageId(): string {
        return this.languageId;
    }

    setSourceFormat(format: ESourceFormat): void {
        this.format = format;
    }

    getNotedComments(): commentRange[] {
        return this.notedCommentRanges;
    }
}
