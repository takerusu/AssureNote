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

///<reference path='./Plugin.ts'/>
///<reference path='../d.ts/codemirror.d.ts'/>

module AssureNote {
    export class CodeMirrorEditorPanel extends Panel {
        Element: JQuery;
        Timeout: number;
        Editor: CodeMirror.Editor;

        constructor(public App: AssureNoteApp, private IsEditRecursive: boolean, TextArea: HTMLTextAreaElement, CodeMirrorConfig: CodeMirror.EditorConfiguration, private Wrapper: HTMLElement, public WrapperCSS: any) {
            super(App);
            this.Editor = CodeMirror.fromTextArea(TextArea, CodeMirrorConfig);
            $(this.Editor.getWrapperElement()).css({
                height: "100%",
                width: "100%",
                background: "rgba(255, 255, 255, 0.85)"
            });
            this.Element = $(Wrapper);
            this.Element.css(WrapperCSS);
            this.Element.css({ display: "none" });
        }

        UpdateCSS(CSS: any) {
            this.Element.css(CSS);
        }

        private OnOutSideClicked: () => void;

        EnableEditor(WGSN: string, NodeView: NodeView, IsRecursive: boolean): void {
            if (this.Timeout) {
                this.Element.removeClass();
                clearInterval(this.Timeout);
            }

            /* TODO Remove this */
            if (IsRecursive && (NodeView.Status == EditStatus.SingleEditable)) {
                return;
            }

            this.Timeout = null;
            var Model = NodeView.Model;
            this.App.FullScreenEditorPanel.IsVisible = false;
            this.App.SocketManager.StartEdit({"UID": Model.UID, "IsRecursive": IsRecursive, "UserName": this.App.GetUserName()});

            var Callback = (event: MouseEvent) => {
                this.Element.blur();
            };
            var App = this.App;

            this.Editor.getDoc().setValue(WGSN);
            //this.Element.off("blur").on("blur", (e: JQueryEventObject) => {
            //    e.stopPropagation();
            //    e.preventDefault();
            //    this.DisableEditor(NodeView, WGSN);
            //});
            this.OnOutSideClicked = () => {
                this.DisableEditor(NodeView, WGSN);
            };
            $("#editor-background").off("click").on("click", this.OnOutSideClicked);
            $("#editor-background").off("contextmenu").on("contextmenu", this.OnOutSideClicked);

            $("#editor-background").stop(true, true).css("opacity", this.DarkenBackGround() ? 0.4 : 0).show();
            this.Element.stop(true, true).css("opacity", 1).show();
            this.Editor.refresh();
            this.Editor.focus();
            this.Activate();
        }

        DisableEditor(OldNodeView: NodeView, OldWGSN: string): void {
            var WGSN: string = this.Editor.getDoc().getValue();
            this.App.MasterRecord.OpenEditor(this.App.GetUserName(), "todo", null, "test");
            var Node: GSNNode = this.App.MasterRecord.EditingDoc.GetNode(OldNodeView.Model.UID);
            var NewNode: GSNNode;
            NewNode = Node.ReplaceSubNodeAsText(WGSN, this.IsEditRecursive);
            var Writer: StringWriter = new StringWriter();
            if (NewNode && NewNode.FormatSubNode(1, Writer, true), Writer.toString().trim() != OldWGSN.trim()) {
                this.App.MasterRecord.EditingDoc.RenumberAll();
                var TopGoal = this.App.MasterRecord.EditingDoc.TopNode;

                var NewNodeView: NodeView = new NodeView(TopGoal, true);
                NewNodeView.SaveFlags(this.App.PictgramPanel.ViewMap);
                this.App.PictgramPanel.InitializeView(NewNodeView);
                this.App.PictgramPanel.Draw(null);

                this.App.FullScreenEditorPanel.IsVisible = true;
                this.App.SocketManager.UpdateWGSN();
                this.App.MasterRecord.CloseEditor();
            } else {
                this.App.MasterRecord.DiscardEditor();
            }
            this.App.SocketManager.Emit('finishedit', OldNodeView.Model.UID);
            $(this.Wrapper).animate({ opacity: 0 }, 300).hide(0);
            $("#editor-background").animate({ opacity: 0 }, 300).hide(0);

            var Panel = this.App.PictgramPanel;
            Panel.Activate();
        }

        OnKeyDown(Event: KeyboardEvent): void {
            this.Editor.focus();
            if (Event.keyCode == 27 /* Esc */) {
                Event.stopPropagation();
                this.OnOutSideClicked();
            }
        }

        DarkenBackGround(): boolean {
            return true;
        }
    }

    export class SingleNodeEditorPanel extends CodeMirrorEditorPanel {
        constructor(App: AssureNoteApp) {
            var TextArea = <HTMLTextAreaElement>document.getElementById('singlenode-editor');
            var Wrapper = document.getElementById('singlenode-editor-wrapper');
            super(App, false, TextArea, { lineNumbers: false, mode: 'wgsn', lineWrapping: true }, Wrapper, { position: "absolute" });
        }
        DarkenBackGround(): boolean {
            return false;
        }
    }

    export class WGSNEditorPanel extends CodeMirrorEditorPanel {
        constructor(App: AssureNoteApp) {
            var TextArea = <HTMLTextAreaElement>document.getElementById('editor');
            var Wrapper = document.getElementById('editor-wrapper');
            super(App, true, TextArea, { lineNumbers: true, mode: 'wgsn', lineWrapping: true, extraKeys: { "Shift-Space": "autocomplete" } }, Wrapper, { position: "fixed", top: "5%", left: "5%", width: "90%", height: "90%" });
        }
    }
}
