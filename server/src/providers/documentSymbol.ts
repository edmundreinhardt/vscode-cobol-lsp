
import { Range, SymbolInformation, Position, DocumentSymbolParams, DocumentSymbol, SymbolKind, Location } from "vscode-languageserver";
import { COBOLTokenStyle } from "../language/cobolsourcescanner";
import { VSCOBOLConfiguration } from "./vsconfiguration";
import { VSLogger } from "../vslogger";
import { outlineFlag } from "../iconfiguration";
import { VSCOBOLSourceScanner } from "./vscobolscanner";

import { documents } from '../instance';



    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    export default async function provideDocumentSymbols(params: DocumentSymbolParams): Promise<DocumentSymbol[]|undefined> {
        const uri = params.textDocument.uri;
        const document = documents.get(uri);

        const symbols: DocumentSymbol[] = [];
        const settings = VSCOBOLConfiguration.get();
        const outlineLevel = settings.outline;

        if (outlineLevel === outlineFlag.Off) {
            return symbols;
        }

        const sf = VSCOBOLSourceScanner.getCachedObject(document, settings);

        if (sf === undefined) {
            return symbols;
        }

        const ownerUri = uri;

        let includePara = true;
        let includeVars = true;         
        let includeSections = true;

        if (outlineLevel === outlineFlag.Partial) {
            includePara = false;
        }

        if (outlineLevel === outlineFlag.Skeleton) {
            includeVars = false;
            includeSections = false;
            includePara = false;
        }

        for (const token of sf.tokensInOrder) {
            try {
                if (token.ignoreInOutlineView === false) {
                    const srange =  Range.create(Position.create(token.startLine, token.startColumn),
                        Position.create(token.endLine, token.endColumn));

                    const lrange = Location.create(ownerUri, srange);

                    const container = token.parentToken !== undefined ? token.parentToken.description : "";
                    switch (token.tokenType) {
                        case COBOLTokenStyle.ClassId:
                        case COBOLTokenStyle.ProgramId:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.Class, srange, srange, [])); 
                            //TODO: compute children - was parent=container before
                            break;
                        case COBOLTokenStyle.CopyBook:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.File, srange, srange, []));
                            break;
                        case COBOLTokenStyle.CopyBookInOrOf:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.File, srange, srange, []));
                            break;
                        case COBOLTokenStyle.File:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.File, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Declaratives:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.Method, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Division:
                            symbols.push(DocumentSymbol.create(token.name, token.description, SymbolKind.Method, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Paragraph:
                            if (includePara === false) {
                                break;
                            }
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Method, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Section:
                            if (includeSections === false) {
                                break;
                            }
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Method, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Exec:
                        case COBOLTokenStyle.EntryPoint:
                        case COBOLTokenStyle.FunctionId:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Function, srange, srange, []));
                            break;
                        case COBOLTokenStyle.EnumId:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Enum, srange, srange, []));
                            break;
                        case COBOLTokenStyle.InterfaceId:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Interface, srange, srange, []));
                            break;
                        case COBOLTokenStyle.ValueTypeId:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Struct, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Variable:
                            if (includeVars === false) {
                                break;
                            }

                            // drop fillers
                            if (token.tokenNameLower === "filler") {
                                continue;
                            }

                            if (token.extraInformation1 === "fd" || token.extraInformation1 === "sd"
                                || token.extraInformation1 === "rd" || token.extraInformation1 === "select") {
                                symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.File, srange, srange, []));
                            }
                            else {
                                if (token.extraInformation1.indexOf("-GROUP") !== -1) {
                                    symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Struct, srange, srange, []));
                                } else if (token.extraInformation1.indexOf("88") !== -1) {
                                    symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.EnumMember, srange, srange, []));
                                } else if (token.extraInformation1.indexOf("-OCCURS") !== -1) {
                                    symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Array, srange, srange, []));
                                } else {
                                    symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Field, srange, srange, []));
                                }
                            }
                            break;
                        case COBOLTokenStyle.ConditionName:
                            if (includeVars === false) {
                                break;
                            }
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.TypeParameter, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Union:
                            if (includeVars === false) {
                                break;
                            }
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Struct, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Constant:
                            if (includeVars === false) {
                                break;
                            }
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Constant, srange, srange, []));
                            break;
                        case COBOLTokenStyle.MethodId:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Method, srange, srange, []));
                            break;
                        case COBOLTokenStyle.Property:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Property, srange, srange, []));
                            break;

                        case COBOLTokenStyle.Constructor:
                            symbols.push(DocumentSymbol.create(token.name,token.description, SymbolKind.Constructor, srange, srange, []));
                            break;
                    }
                }
            }
            catch (e) {
                VSLogger.logException("Failed " + e + " on " + JSON.stringify(token),e as Error);
            }
        }
        return symbols;
    }