import path from 'path';
import { WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';
import { connection } from './instance';

export async function getShortWorkspaceFilename(uri: URI) {
	const workspaceFolders = await connection.workspace.getWorkspaceFolders();
	let workspaceFolder: WorkspaceFolder | undefined;
	if (workspaceFolders) {
		workspaceFolder = workspaceFolders.find(folderUri => uri.path.startsWith(URI.parse(folderUri.uri).path));
	}
	if (workspaceFolder) {
		const folderPath: URI = URI.parse(workspaceFolder.uri);
		return path.relative(folderPath.path, uri.path);
	}
}