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


module AssureNote {
    export class MessageCommand extends Command {
        public GetCommandLineNames(): string[] {
            return ["message"];
        }

        public GetHelpHTML(): string {
            return "<code>message msg</code><br>Send message to the chat server."
        }

        public Invoke(CommandName: string, Params: any[]) {
            if (this.App.SocketManager.IsConnected()) {
                this.App.SocketManager.Emit('message', Params.join(' '));
                (<any>$).notify(Params.join(' '), 'info');
            }
        }

        public CanUseOnViewOnlyMode(): boolean {
            return true;
        }
    }

    export class ConnectCommand extends Command {
        public GetCommandLineNames(): string[] {
            return ["connect"];
        }

        public GetHelpHTML(): string {
            return "<code>connect [room?] [uri?]</code><br>Connect to the chat server."
        }

        public Invoke(CommandName: string, Params: any[]) {
            if (Params.length > 2) {
                this.App.DebugP('Invalid parameter: ' + Params);
                return;
            }
            var room: string = null;
            var url: string = null;
            if (Params.length == 2) {
                room = Params[0];
                url = Params[1];
            } else if (Params.length == 1) {
                if (AssureNoteUtils.isValidURL(Params[0])) {
                    url = Params[0];
                } else {
                    room = Params[0];
                }
            }
            this.App.ModeManager.SetMode(AssureNoteMode.View);
            if (this.App.SocketManager.IsOperational()) {
                this.App.SocketManager.Connect(room, url);
            }
        }

        public CanUseOnViewOnlyMode(): boolean {
            return true;
        }
    }

    export class MessageChatPlugin extends Plugin {
        public EditorUtil: CodeMirrorEditorPanel;
        constructor(public AssureNoteApp: AssureNoteApp) {
            super();
            this.AssureNoteApp.SocketManager.RegisterSocketHandler('message', function (data) {
                    console.log(data);
                (<any>$).notify(data);
            });
            this.AssureNoteApp.RegistCommand(new MessageCommand(this.AssureNoteApp));
        }

        RenderSVG(ShapeGroup: SVGGElement, NodeView: NodeView): void {
            NodeView.RemoveColorStyle(ColorStyle.SingleEdit);
            NodeView.RemoveColorStyle(ColorStyle.Locked);
            switch (NodeView.Status) {
                case EditStatus.SingleEditable:
                    NodeView.AddColorStyle(ColorStyle.SingleEdit); break;

                case EditStatus.Locked:
                    NodeView.AddColorStyle(ColorStyle.Locked); break;
            }
        }
    }

    export class ConnectServerPlugin extends Plugin {
        socket: any;
        constructor(public AssureNoteApp: AssureNoteApp) {
            super();
            this.AssureNoteApp.RegistCommand(new ConnectCommand(this.AssureNoteApp));
        }
    }
}

AssureNote.OnLoadPlugin((App: AssureNote.AssureNoteApp) => {
    var MessageChatPlugin = new AssureNote.MessageChatPlugin(App);
    App.PluginManager.SetPlugin("message", MessageChatPlugin);
    var ConnectserverPlugin = new AssureNote.ConnectServerPlugin(App);
    App.PluginManager.SetPlugin("connect", ConnectserverPlugin);
});
