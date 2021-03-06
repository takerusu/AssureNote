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
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
///<reference path="../../src/AssureNoteParser.ts" />
///<reference path="../../src/Plugin.ts" />
var AssureNote;
(function (AssureNote) {
    var RemoveCommand = (function (_super) {
        __extends(RemoveCommand, _super);
        function RemoveCommand(App) {
            _super.call(this, App);
        }
        RemoveCommand.prototype.GetCommandLineNames = function () {
            return ["rm", "remove"];
        };

        RemoveCommand.prototype.GetHelpHTML = function () {
            return "<code>remove label</code><br>Remove a node and it's descendant.";
        };

        RemoveCommand.prototype.Invoke = function (CommandName, Params) {
            var _this = this;
            if (Params.length > 0) {
                var TargetView = this.App.GetNodeFromLabel(Params[0]);
                if (TargetView == this.App.PictgramPanel.TopNodeView) {
                    AssureNote.AssureNoteUtils.Notify("G1 cannot be removed");
                }
                if (TargetView) {
                    this.App.EditDocument("todo", "test", function () {
                        var Node = _this.App.MasterRecord.EditingDoc.GetNode(TargetView.Model.UID);
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
                AssureNote.AssureNoteUtils.Notify("remove: need target node");
            }
        };

        RemoveCommand.RemoveDescendantsRecursive = function (Node) {
            if (Node.SubNodeList == null) {
                Node.ParentNode = null;
                return;
            }

            for (var i = 0; i < Node.SubNodeList.length; i++) {
                RemoveCommand.RemoveDescendantsRecursive(Node.SubNodeList[i]);
            }
            Node.SubNodeList = null;
        };
        return RemoveCommand;
    })(AssureNote.Command);
    AssureNote.RemoveCommand = RemoveCommand;

    var RemoveNodePlugin = (function (_super) {
        __extends(RemoveNodePlugin, _super);
        function RemoveNodePlugin(AssureNoteApp) {
            _super.call(this);
            this.AssureNoteApp = AssureNoteApp;
            this.SetHasMenuBarButton(true);
            this.AssureNoteApp.RegistCommand(new RemoveCommand(this.AssureNoteApp));
        }
        RemoveNodePlugin.prototype.CreateMenuBarButton = function (View) {
            var _this = this;
            var App = this.AssureNoteApp;
            if (View == App.PictgramPanel.TopNodeView) {
                return null;
            }
            return new AssureNote.NodeMenuItem("remove-id", "/images/remove.png", "remove", function (event, TargetView) {
                var Command = _this.AssureNoteApp.FindCommandByCommandLineName("remove");
                if (Command) {
                    Command.Invoke(null, [TargetView.Label]);
                }
            });
        };
        return RemoveNodePlugin;
    })(AssureNote.Plugin);
    AssureNote.RemoveNodePlugin = RemoveNodePlugin;
})(AssureNote || (AssureNote = {}));

AssureNote.OnLoadPlugin(function (App) {
    var RemoveNodePlugin = new AssureNote.RemoveNodePlugin(App);
    App.PluginManager.SetPlugin("Remove", RemoveNodePlugin);
});
//# sourceMappingURL=RemoveNode.js.map
