import {format} from './prettyprint';
import {
    workspace,
    window,
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider,
    Range,
    TextDocument,
    FormattingOptions,
    CancellationToken,
    TextEdit,
    Selection,
    Position
} from 'vscode';

export class EditProvider implements DocumentFormattingEditProvider {
    provideDocumentFormattingEdits(document: TextDocument, options: FormattingOptions, token: CancellationToken): TextEdit[] {
        let useSpaces = workspace.getConfiguration('angular-template-formatter').get('useSpaces', true);
        let indentation = workspace.getConfiguration('angular-template-formatter').get<number>('indentWidth', 2);
        let closeTagSameLine = workspace.getConfiguration('angular-template-formatter').get('closeTagSameLine', true);
        let groupAttrsByTypes = workspace.getConfiguration('angular-template-formatter').get('groupAttrsByTypes', true);
        let firstAttrOnTagLine = workspace.getConfiguration('angular-template-formatter').get('firstAttrOnTagLine', true);
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