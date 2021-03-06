// ***************************************************************************
// Copyright (c) 2014, AssureNote project authors. All rights reserved.
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
// *  Redistributions of source code must retain the above copyright notice,
//    this list of conditions and the following disclaimer.
// *  Redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
// OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
// WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
// OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
// **************************************************************************

///<reference path="../../src/AssureNoteParser.ts" />
///<reference path="../../src/Plugin.ts" />
///<reference path="../../src/Editor.ts" />
///<reference path="../../src/Command.ts" />

module AssureNote {
    export class FullScreenEditorCommand extends Command {

        public GetCommandLineNames(): string[]{
            return ["edit"];
        }

        public GetHelpHTML(): string {
            return "<code>edit [label]</code><br>Open editor."
        }

        public Invoke(CommandName: string, Params: any[]) {
            var Label: string;
            if (Params.length < 1) {
                Label = this.App.MasterRecord.GetLatestDoc().TopNode.GetLabel();
            } else {
                Label = Params[0].toUpperCase();
            }
            var event = document.createEvent("UIEvents");
            var TargetView = this.App.PictgramPanel.ViewMap[Label];
            if (TargetView != null) {
                if (TargetView.GetNodeType() == GSNType.Strategy) {
                    AssureNoteUtils.Notify("Subtree editor cannot open at Strategy");
                    return;
                }
                var Writer = new StringWriter();
                TargetView.Model.FormatSubNode(1, Writer, true);
                this.App.FullScreenEditorPanel.EnableEditor(Writer.toString().trim(), TargetView, true);
            } else {
                AssureNoteUtils.Notify(Label + " is not found");
            }
        }
    }

    export class FullScreenEditorPlugin extends Plugin {
        constructor(public AssureNoteApp: AssureNoteApp) {
            super();
            this.SetHasMenuBarButton(true);
            this.SetHasEditor(true);
            this.AssureNoteApp.RegistCommand(new FullScreenEditorCommand(this.AssureNoteApp));
        }

        CreateMenuBarButton(NodeView: NodeView): NodeMenuItem {
            if (NodeView.GetNodeType() == GSNType.Strategy) {
                return null;
            }
            return new NodeMenuItem("fullscreeneditor-id", "/images/editor.png", "fullscreeneditor",
                (event: Event, TargetView: NodeView) => {
                    var Command = this.AssureNoteApp.FindCommandByCommandLineName("edit");
                    if (Command) {
                        Command.Invoke(null, [TargetView.Label]);
                    }
            });
        }

        /* This focuses on the node where the cursor of CodeMirror indicate */
        MoveBackgroundNode(doc: CodeMirror.Doc) {
            var UID: string = null;
            var line = doc.getCursor().line;
            while (line >= 0) {
                var LineString: string = doc.getLine(line);
                if (LineString.indexOf('*') == 0) {
                    UID = WikiSyntax.ParseUID(LineString);
                    break;
                }
                line -= 1;
            }
            if (UID != null) {
                var Keys: string[] = Object.keys(this.AssureNoteApp.PictgramPanel.ViewMap);
                for (var i in Keys) {
                    var View: NodeView = this.AssureNoteApp.PictgramPanel.ViewMap[Keys[i]];
                    /* Node exists and visible */
                    if (View && View.Model && Lib.DecToHex(View.Model.UID) == UID) {
                        console.log(View.GetCenterGX() + ' ' + View.GetCenterGY());
                        this.AssureNoteApp.PictgramPanel.Viewport.SetCameraPosition(View.GetCenterGX(), View.GetCenterGY());
                    }
                }
            }
        }
    }
}

AssureNote.OnLoadPlugin((App: AssureNote.AssureNoteApp) => {
    App.PluginManager.SetPlugin("open", new AssureNote.FullScreenEditorPlugin(App));
});
