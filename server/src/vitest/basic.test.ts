import { stringify } from 'querystring';
import { assert, expect, test } from 'vitest';
import { l } from 'vitest/dist/index-50755efe';
import { ESourceFormat, IExternalFeatures } from '../externalfeatures';
import { fileformatStrategy, hoverApi, ICOBOLSettings, IEditorMarginFiles, intellisenseStyle, outlineFlag } from '../iconfiguration';
import { ICOBOLSourceScanner, COBOLSourceScanner, ICOBOLSourceScannerEvents, COBOLToken } from '../language/cobolsourcescanner';
import { commentRange, ICommentCallback, ISourceHandler } from '../language/isourcehandler';

// import * as cobol from '../language/cobolsourcescanner';
// import { ISourceHandler } from '../language/isourcehandler';
// import { VSCodeSourceHandler } from '../vscodesourcehandler';

// import { TextDocument } from 'vscode-languageserver-textdocument';

// Edit an assertion and save to see HMR in action

test('Math.sqrt()', () => {
  expect(Math.sqrt(4)).toBe(2);
  expect(Math.sqrt(144)).toBe(12);
  expect(Math.sqrt(2)).toBe(Math.SQRT2);
});

test('JSON', () => {
  const input = {
    foo: 'hello',
    bar: 'world',
  };

  const output = JSON.stringify(input);

  expect(output).eq('{"foo":"hello","bar":"world"}');
  assert.deepEqual(JSON.parse(output), input, 'matches original');
});

test('TextDocumentSourceHandler', () => {
	const sourceHandler = new MockSourceHandler();
	const scanner: ICOBOLSourceScanner = new COBOLSourceScanner(0, 
		sourceHandler, new MockConfigHandler(), undefined, false, 
		new MockScannerEvents(), new MockExternalFeatures());
});

// Mocked classes for running scanner
class MockSourceHandler implements ISourceHandler {
	source!: string[];
	commentCount!: number;
	constructor() {
		this.source = ["IDENTIFICATION DIVISION.",
						"PROGRAM-ID. TESTCBL."];
	}
	getUriAsString(): string {
		return "testcbl.cbl";
	}
	getLineCount(): number {
		return this.source.length;
	}
	getCommentCount(): number {
		return this.commentCount;
	}
	resetCommentCount(): void {
		this.commentCount = 0;
	}
	getLine(lineNumber: number, raw: boolean): string | undefined {
		return this.source[lineNumber];
	}
	getLineTabExpanded(lineNumber: number): Promise<string | undefined> {
		return new Promise((resolve, reject) => {return this.getLine(lineNumber, false);});
	}
	setUpdatedLine(lineNumber: number, line: string): void {
		this.source[lineNumber] = line;
	}
	getUpdatedLine(linenumber: number): string | undefined {
		return this.getLine(linenumber, false);
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setDumpAreaA(flag: boolean): void {
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setDumpAreaBOnwards(flag: boolean): void {
	}
	getFilename(): string {
		return "testcbl.cbl";
	}
	addCommentCallback(commentCallback: ICommentCallback): void {
		// not tracking comment call backs yet
	}
	getDocumentVersionId(): bigint {
		return BigInt(0);
	}
	getIsSourceInWorkSpace(): boolean {
		return true;
	}
	getShortWorkspaceFilename(): string {
		return this.getFilename();
	}
	getLanguageId(): string {
		return "cblle";
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	setSourceFormat(format: ESourceFormat): void {
	}
	getNotedComments(): commentRange[] {
		throw new Error('Method not implemented.');
	}
}

class MockConfigHandler implements ICOBOLSettings {
	enable_tabstop!: boolean;
	pre_scan_line_limit!: number;
	copybooks_nested!: boolean;
	outline!: outlineFlag;
	copybookdirs!: string[];
	invalid_copybookdirs!: string[];
	copybookexts!: string[];
	program_extensions!: string[];
	tabstops!: number[];
	linter!: boolean;
	line_comment!: boolean;
	fileformat_strategy!: fileformatStrategy;
	enable_data_provider!: boolean;
	disable_unc_copybooks_directories!: boolean;
	intellisense_item_limit!: number;
	process_metadata_cache_on_start!: boolean;
	cache_metadata_inactivity_timeout!: number;
	parse_copybooks_for_references!: boolean;
	workspacefolders_order!: string[];
	linter_mark_as_information!: boolean;
	linter_unused_sections!: boolean;
	linter_unused_paragraphs!: boolean;
	linter_house_standards!: boolean;
	linter_house_standards_rules!: string[];
	linter_ignore_section_before_entry!: boolean;
	linter_ignore_missing_copybook!: boolean;
	scan_comments_for_hints!: boolean;
	cache_metadata_verbose_messages!: boolean;
	scan_comment_copybook_token!: string;
	sourceview!: boolean;
	sourceview_include_jcl_files!: boolean;
	sourceview_include_hlasm_files!: boolean;
	sourceview_include_pli_files!: boolean;
	sourceview_include_doc_files!: boolean;
	sourceview_include_script_files!: boolean;
	sourceview_include_object_files!: boolean;
	sourceview_include_test_files!: boolean;
	format_constants_to_uppercase!: boolean;
	format_on_return!: boolean;
	intellisense_style!: intellisenseStyle;
	editor_maxTokenizationLineLength!: number;
	metadata_symbols!: string[];
	metadata_entrypoints!: string[];
	metadata_types!: string[];
	metadata_files!: string[];
	metadata_knowncopybooks!: string[];
	maintain_metadata_cache!: boolean;
	maintain_metadata_recursive_search!: boolean;
	enable_semantic_token_provider!: boolean;
	enable_text_replacement!: boolean;
	editor_margin_files!: IEditorMarginFiles[];
	enable_source_scanner!: boolean;
	valid_cobol_language_ids!: string[];
	files_exclude!: string[];
	scan_line_limit!: number;
	scan_time_limit!: number;
	in_memory_cache_size!: number;
	suggest_variables_when_context_is_unknown!: boolean;
	hover_show_known_api!: hoverApi;
	enable_comment_tags!: boolean;
	comment_tag_word!: boolean;
	snippets!: boolean;
	enable_columns_tags!: boolean;
	hover_show_encoded_literals!: boolean;
	check_file_format_before_file_scan!: boolean;
	intellisense_no_space_keywords!: string[];
	custom_intellisense_rules!: string[];
	margin!: boolean;
	enable_codelens_variable_references!: boolean;
	enable_codelens_section_paragraph_references!: boolean;
	enable_codelens_copy_replacing!: boolean;
}
class MockScannerEvents implements ICOBOLSourceScannerEvents {
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	start(qp: ICOBOLSourceScanner): void {
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	processToken(token: COBOLToken): void {
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	finish(): void {
	}
} 
class MockExternalFeatures implements IExternalFeatures {
	loggedMessages: string[] = [];
	loggedExceptions: string[] = [];
	logMessage(message: string): void {
		this.loggedMessages.push(message);
	}
	logException(message: string, ex: Error): void {
		this.loggedExceptions.push(message);
	}
	logTimedMessage(timeTaken: number, message: string, ...parameters: any[]): boolean {
		throw new Error('Method not implemented.');
	}
	performance_now(): number {
		throw new Error('Method not implemented.');
	}
	expandLogicalCopyBookToFilenameOrEmpty(filename: string, inDirectory: string, config: ICOBOLSettings): string {
		throw new Error('Method not implemented.');
	}
	getFullWorkspaceFilename(sdir: string, sdirMs: bigint): string | undefined {
		throw new Error('Method not implemented.');
	}
	setWorkspaceFolders(folders: string[]): void {
		throw new Error('Method not implemented.');
	}
	getWorkspaceFolders(): string[] {
		throw new Error('Method not implemented.');
	}
	isFile(possibleFilename: string): boolean {
		throw new Error('Method not implemented.');
	}
	isDirectory(possibleDirectory: string): boolean {
		throw new Error('Method not implemented.');
	}
	getFileModTimeStamp(filename: string): bigint {
		return BigInt(0);
	}
	getCombinedCopyBookSearchPath(): string[] {
		throw new Error('Method not implemented.');
	}
	setCombinedCopyBookSearchPath(fileSearchDirectory: string[]): void {
		throw new Error('Method not implemented.');
	}
	getSourceTimeout(config: ICOBOLSettings): number {
		throw new Error('Method not implemented.');
	}
	getURLCopyBookSearchPath(): string[] {
		throw new Error('Method not implemented.');
	}
	setURLCopyBookSearchPath(fileSearchDirectory: string[]): void {
		throw new Error('Method not implemented.');
	}
	isFileASync(possibleFilename: string): Promise<boolean> {
		throw new Error('Method not implemented.');
	}

}