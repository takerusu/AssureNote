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

module AssureNote {

    export class RemoveCommand extends Command {
        constructor(App: AssureNote.AssureNoteApp) {
            super(App);
        }

        public GetCommandLineNames(): string[] {
            return ["rm", "remove"];
        }

        public GetHelpHTML(): string {
            return "<code>remove label</code><br>Remove a node and it's descendant."
        }

        public Invoke(CommandName: string, Params: any[]): void {
            if (Params.length > 0) {
                var TargetView = this.App.GetNodeFromLabel(Params[0]);
                if (TargetView == this.App.PictgramPanel.TopNodeView) {
                    AssureNoteUtils.Notify("G1 cannot be removed");
                }
                if (TargetView) {
                    this.App.EditDocument("todo", "test", () => {
                        var Node = this.App.MasterRecord.EditingDoc.GetNode(TargetView.Model.UID);
                        var Parent = Node.ParentNode;
                        for (var i = 0; i < Parent.SubNodeList.length; i++) {
                            var it = Parent.SubNodeList[i];
                            if (Node == it) {
                                Parent.SubNodeList.splice(i, 1);
                            }
                        }

                        RemoveCommand.RemoveDescendantsRecursive(Node);
                    });
                }
            } else {
                AssureNoteUtils.Notify("remove: need target node");
            }
        }

        public static RemoveDescendantsRecursive(Node: GSNNode): void {
            if (Node.SubNodeList == null) {
                Node.ParentNode = null;
                return;
            }

            for (var i = 0; i < Node.SubNodeList.length; i++) {
                RemoveCommand.RemoveDescendantsRecursive(Node.SubNodeList[i]);
            }
            Node.SubNodeList = null;
        }
    }

    export class RemoveNodePlugin extends Plugin {

        constructor(public AssureNoteApp: AssureNoteApp) {
            super();
            this.SetHasMenuBarButton(true);
            this.AssureNoteApp.RegistCommand(new RemoveCommand(this.AssureNoteApp));
        }

        CreateMenuBarButton(View: NodeView): NodeMenuItem {
            var App = this.AssureNoteApp;
            if (View == App.PictgramPanel.TopNodeView) {
                return null;
            }
            return new NodeMenuItem("remove-id", "/images/remove.png", "remove", (event: Event, TargetView: NodeView) => {
                var Command = this.AssureNoteApp.FindCommandByCommandLineName("remove");
                if (Command) {
                    Command.Invoke(null, [TargetView.Label]);
                }
            });
        }

    }
}

AssureNote.OnLoadPlugin((App: AssureNote.AssureNoteApp) => {
    var RemoveNodePlugin = new AssureNote.RemoveNodePlugin(App);
    App.PluginManager.SetPlugin("Remove", RemoveNodePlugin);
});
