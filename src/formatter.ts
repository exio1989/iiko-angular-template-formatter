import {format} from './prettyprint';
import {
    workspace,
    window,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit
} from 'vscode';

export class EditProvider implements DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): TextEdit[] {
        let useSpaces = workspace.getConfiguration().get('conf.useSpaces', true);
        let indentation = workspace.getConfiguration().get<number>('conf.indentWidth', 2);
        let closeTagSameLine = workspace.getConfiguration().get('conf.closeTagSameLine', true);
        let groupAttrsByTypes = workspace.getConfiguration().get('conf.groupAttrsByTypes', true);
        let firstAttrOnTagLine = workspace.getConfiguration().get('conf.firstAttrOnTagLine', true);
        try {
            if(document.fileName.endsWith('.scala.html')) {
                return [];
            }
            let text = document.getText();
            return [TextEdit.replace(
                new Range(document.positionAt(0), document.positionAt(text.length)),
                format(text, indentation, useSpaces, closeTagSameLine, groupAttrsByTypes, firstAttrOnTagLine)
            )];
        } catch (e) {
            window.showErrorMessage(e.message);
        }
    }
}