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
///<reference path="./AssureNote.ts" />
var AssureNote;
(function (AssureNote) {
    var Tooltip = (function (_super) {
        __extends(Tooltip, _super);
        function Tooltip(AssureNoteApp) {
            _super.call(this, AssureNoteApp);
            this.AssureNoteApp = AssureNoteApp;
            this.Tooltip = null;
            this.CurrentView = null;
        }
        Tooltip.prototype.Enable = function () {
        };

        /**
        * Remove Tooltip from Content layer.
        * @param none
        */
        Tooltip.prototype.Remove = function () {
            this.Tooltip.remove();
            this.Tooltip = null;
            this.CurrentView = null;
            this.IsEnable = false;
        };

        Tooltip.prototype.Create = function (CurrentView, ControlLayer, Contents) {
            if (this.Tooltip != null)
                this.Remove();
            if (Contents == null || Contents.length == 0)
                return;

            this.IsEnable = true;
            this.CurrentView = CurrentView;
            this.Tooltip = $('<div"></div>');
            var pre = $('<pre id="tooltip"></pre>');

            var ul = $(document.createElement('ul'));
            ul.addClass('list-unstyled');
            for (var i = 0; i < Contents.length; i++) {
                ul.append(Contents[i]);
            }
            pre.append(ul);
            this.Tooltip.append(pre);
            this.Tooltip.appendTo(ControlLayer);

            var Top = this.CurrentView.GetGY() + this.CurrentView.Shape.GetNodeHeight() + 5;
            var Left = this.CurrentView.GetGX() + this.CurrentView.Shape.GetNodeWidth() / 2;
            this.Tooltip.css({
                position: 'absolute',
                top: Top,
                left: Left,
                display: 'block',
                opacity: 100
            });
        };
        return Tooltip;
    })(AssureNote.Panel);
    AssureNote.Tooltip = Tooltip;
})(AssureNote || (AssureNote = {}));
//# sourceMappingURL=Tooltip.js.map
