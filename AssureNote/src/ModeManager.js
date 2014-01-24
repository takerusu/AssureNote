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
///<reference path='../d.ts/jquery_plugins.d.ts'/>
var AssureNote;
(function (AssureNote) {
    var ModeManager = (function () {
        function ModeManager(App, Mode) {
            this.App = App;
            this.Mode = Mode;
            this.WrapperElement = $('#edit-mode');
            console.log(this.WrapperElement);
            var input = document.createElement('input');
            input.setAttribute('type', 'checkbox');
            input.setAttribute('checked', '');
            //$(input).appendTo(this.WrapperElement);
            //$(input).bootstrapSwitch('setSizeClass', '');
        }
        ModeManager.prototype.GetMode = function () {
            return this.Mode;
        };

        ModeManager.prototype.SetMode = function (Mode) {
            this.Mode = Mode;
        };
        return ModeManager;
    })();
    AssureNote.ModeManager = ModeManager;
})(AssureNote || (AssureNote = {}));
//# sourceMappingURL=ModeManager.js.map
