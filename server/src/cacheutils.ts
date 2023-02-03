import { ICOBOLSettings } from "./iconfiguration";
import { InMemoryGlobalCacheHelper, InMemoryGlobalSymbolCache } from "./globalcachehelper";
import { COBOLFileSymbol } from "./cobolglobalcache";
import { VSLogger } from './vslogger';

export function saveGlobalCacheToWorkspace(settings: ICOBOLSettings, update = true): void {
	// only update if we have a workspace
	// if (VSWorkspaceFolders.get() === undefined) {
	// 	return;
	// }

	// // unless we say we want single folder support, never apply an update to it
	// if (vscode.workspace.workspaceFile === undefined) {
	// 	return;
	// }

	// only update when we are caching
	if (settings.maintain_metadata_cache === false) {
		return;
	}

	if (InMemoryGlobalSymbolCache.isDirty) {
		const symbols: string[] = settings.metadata_symbols;
		const entrypoints: string[] = settings.metadata_entrypoints;
		const types: string[] = settings.metadata_types;
		const files: string[] = settings.metadata_files;
		const knownCopybooks: string[] = settings.metadata_knowncopybooks;
		symbols.length = 0;
		entrypoints.length = 0;
		types.length = 0;
		files.length = 0;
		knownCopybooks.length = 0;

		for (const [i] of InMemoryGlobalSymbolCache.callableSymbols.entries()) {
			if (i !== null && i.length !== 0) {
				const fileSymbol = InMemoryGlobalSymbolCache.callableSymbols.get(i);
				if (fileSymbol !== undefined) {
					fileSymbol.forEach(function (value: COBOLFileSymbol) {
						update = true;

						// do not save a callable that is in the defaultCallableSymbol map
						if (InMemoryGlobalSymbolCache.defaultCallableSymbols.has(i) === false) {
							if (value.lnum !== 0) {
								symbols.push(`${i},${value.filename},${value.lnum}`);
							} else {
								symbols.push(`${i},${value.filename}`);
							}
						}
					});
				}
			}
			else {
				update = true;
			}
		}

		for (const [i] of InMemoryGlobalSymbolCache.entryPoints.entries()) {
			if (i !== null && i.length !== 0) {
				const fileSymbol = InMemoryGlobalSymbolCache.entryPoints.get(i);
				if (fileSymbol !== undefined) {
					fileSymbol.forEach(function (value: COBOLFileSymbol) {
						entrypoints.push(`${i},${value.filename},${value.lnum}`);
					});
				}
			}
		}

		for (const [encodedKey,] of InMemoryGlobalSymbolCache.knownCopybooks.entries()) {
			knownCopybooks.push(encodedKey);
		}

		typeToArray(types, "T", InMemoryGlobalSymbolCache.types);
		typeToArray(types, "I", InMemoryGlobalSymbolCache.interfaces);
		typeToArray(types, "E", InMemoryGlobalSymbolCache.enums);

		for (const [fileName] of InMemoryGlobalSymbolCache.sourceFilenameModified.entries()) {
			if (fileName !== null && fileName.length !== 0) {
				const cws = InMemoryGlobalSymbolCache.sourceFilenameModified.get(fileName);
				if (cws !== undefined) {
					files.push(`${cws.lastModifiedTime},${cws.workspaceFilename}`);
				}
			}
		}

		if (update) {
			try {
				// const editorConfig = vscode.workspace.getConfiguration(ExtensionDefaults.defaultEditorConfig);
				// editorConfig.update("metadata_symbols", symbols, false);
				// editorConfig.update("metadata_entrypoints", entrypoints, false);
				// editorConfig.update("metadata_types", types, false);
				// editorConfig.update("metadata_files", files, false);
				// editorConfig.update("metadata_knowncopybooks", knownCopybooks, false);
				InMemoryGlobalSymbolCache.isDirty = false;
			} catch (e) {
				VSLogger.logException("Failed to update metadata", e as Error);
			}
		}
	}
	
}
function typeToArray(types: string[], prefix: string, typeMap: Map<string, COBOLFileSymbol[]>) {
	for (const [i] of typeMap.entries()) {
		const fileSymbol = typeMap.get(i);
		if (fileSymbol !== undefined) {
			fileSymbol.forEach(function (value: COBOLFileSymbol) {
				types.push(`${prefix},${i},${value.filename},${value.lnum}`);
			});
		}
	}
}