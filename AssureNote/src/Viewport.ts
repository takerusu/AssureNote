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

///<reference path="../d.ts/jquery.d.ts" />
///<reference path="../d.ts/pointer.d.ts" />

/* VIEW (MVC) */
module AssureNote {
    export class Pointer {
        constructor(public X: number, public Y: number, public ID: number) { }
        SetPosition(X: number, Y: number) {
            this.X = X;
            this.Y = Y;
        }
    }

    /**
        Controll scroll by mouse, touch and pen and zoom by wheel.
        @class AssureNote.ScrollManager
        @for AssureNote.ViewportManager
    */
    export class ScrollManager {
        private CurrentX: number = 0;
        private CurrentY: number = 0;
        private Dx: number = 0;
        private Dy: number = 0;
        private MainPointerID: number = null;
        private Pointers: Pointer[] = [];

        private timer: number = 0;
        private ANIMATE_THRESHOLD: number = 5;
        private SPEED_MAX: number = 100;


        constructor(private Viewport: ViewportManager) {
        }

        private StartDrag(InitialX: number, InitialY: number) {
            this.CurrentX = InitialX;
            this.CurrentY = InitialY;
            try {
                if (this.OnStartDrag) {
                    this.OnStartDrag(this.Viewport);
                }
            } catch (e) {
            }
        }

        private UpdateDrag(CurrentX: number, CurrentY: number) {
            this.Dx = CurrentX - this.CurrentX;
            this.Dy = CurrentY - this.CurrentY;
            var speed = this.Dx * this.Dx + this.Dy + this.Dy;
            if (speed > this.SPEED_MAX * this.SPEED_MAX) {
                this.Dx *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
                this.Dy *= ((this.SPEED_MAX * this.SPEED_MAX) / speed);
            }

            this.CurrentX = CurrentX;
            this.CurrentY = CurrentY;
            if (this.OnDragged) {
                this.OnDragged(this.Viewport);
            }
        }

        private GetMainPointer(): Pointer {
            return this.Pointers[this.MainPointerID];
        }

        private IsDragging(): boolean {
            return this.MainPointerID != null;
        }

        private StopAnimation(): void {
            clearInterval(this.timer);
            this.Dx = 0;
            this.Dy = 0;
        }

        private EndDrag() {
            this.MainPointerID = null;
            this.Viewport.SetEventMapLayerPosition(false);
            try {
                if (this.OnEndDrag) {
                    this.OnEndDrag(this.Viewport);
                }
            } catch (e) {
            }
        }

        OnDragged: (Viewport: ViewportManager) => void;
        OnStartDrag: (Viewport: ViewportManager) => void;
        OnEndDrag: (Viewport: ViewportManager) => void;

        OnPointerEvent(e: PointerEvent, Screen: ViewportManager) {
            switch (e.type) {
                case "pointerdown":
                    this.Pointers[e.pointerId] = new Pointer(e.clientX, e.clientY, e.pointerId);
                    break;
                case "pointerup":
                    if (!this.Pointers[e.pointerId]) {
                        return
                    }
                    delete this.Pointers[e.pointerId];
                    break;
                case "pointermove":
                    if (!this.Pointers[e.pointerId]) {
                        return
                    }
                    this.Pointers[e.pointerId].SetPosition(e.clientX, e.clientY);
                    break;
                default:
                    return;
            }

            var IsTherePointer: boolean = Object.keys(this.Pointers).length > 0;
            var HasDragJustStarted: boolean = IsTherePointer && !this.IsDragging();
            var HasDragJustEnded: boolean = !this.GetMainPointer() && this.IsDragging();

            if (IsTherePointer) {
                if (HasDragJustStarted) {
                    this.StopAnimation();
                    this.timer = null;
                    var mainPointer: Pointer = this.Pointers[Object.keys(this.Pointers)[0]];
                    this.MainPointerID = mainPointer.ID;
                    this.Viewport.SetEventMapLayerPosition(true);
                    this.StartDrag(mainPointer.X, mainPointer.Y);
                } else {
                    var mainPointer = this.GetMainPointer();
                    if (mainPointer) {
                        this.UpdateDrag(mainPointer.X, mainPointer.Y);
                        Screen.AddOffset(this.Dx, this.Dy);
                    } else {
                        this.EndDrag();
                    }
                }
            } else {
                if (HasDragJustEnded) {
                    if (this.timer) {
                        this.StopAnimation();
                        this.timer = null;
                    }
                    this.timer = setInterval(() => {
                        if (Math.abs(this.Dx) < this.ANIMATE_THRESHOLD && Math.abs(this.Dy) < this.ANIMATE_THRESHOLD) {
                            this.StopAnimation();
                        }
                        this.CurrentX += this.Dx;
                        this.CurrentY += this.Dy;
                        this.Dx *= 0.95;
                        this.Dy *= 0.95;
                        Screen.AddOffset(this.Dx, this.Dy);
                    }, 16);
                }
                this.EndDrag();
            }
        }

        OnDoubleTap(e: PointerEvent, Screen: ViewportManager) {
            var width: number = Screen.ContentLayer.clientWidth;
            var height: number = Screen.ContentLayer.clientHeight;
            var pointer = this.Pointers[0];
        }

        OnMouseWheel(e: { deltaX: number; deltaY: number }, Screen: ViewportManager) {
            Screen.SetCameraScale(Screen.GetCameraScale() * (1 + e.deltaY * 0.02));
        }
    }

    /**
        @class AssureNote.ViewportManager
    */
    export class ViewportManager {
        ScrollManager: ScrollManager = new ScrollManager(this);
        private CameraGX: number = 0;
        private CameraGY: number = 0;
        private Scale: number = 1.0;
        private PageWidth: number = window.innerWidth;
        private PageHeight: number = window.innerHeight;
        private CameraCenterPageX: number;
        private CameraCenterPageY: number;
        public IsPointerEnabled: boolean = true;
        public OnScroll: (Viewport: ViewportManager) => void;

        private SetTransformOriginToElement(Element: HTMLElement, Value: string) {
            Element.style["transformOrigin"] = Value;
            Element.style["MozTransformOrigin"] = Value;
            Element.style["msTransformOrigin"] = Value;
            Element.style["webkitTransformOrigin"] = Value;
        }

        private SetTransformToElement(Element: HTMLElement, Value: string) {
            Element.style["transform"] = Value;
            Element.style["MozTransform"] = Value;
            Element.style["msTransform"] = Value;
            Element.style["webkitTransform"] = Value;
        }

        constructor(public SVGLayer: SVGGElement, public EventMapLayer: HTMLDivElement, public ContentLayer: HTMLDivElement, public ControlLayer: HTMLDivElement) {
            window.addEventListener("resize", (e) => { this.UpdatePageRect(); });
            this.UpdatePageRect();
            this.SetCameraPageCenter(this.GetPageCenterX(), this.GetPageCenterY());
            this.SetTransformOriginToElement(this.ContentLayer, "left top");
            this.SetTransformOriginToElement(this.ControlLayer, "left top");
            this.UpdateAttr();
            var OnPointer = (e: PointerEvent) => { if (this.IsPointerEnabled) { this.ScrollManager.OnPointerEvent(e, this); } };
            this.EventMapLayer.addEventListener("pointerdown", OnPointer, false);
            this.EventMapLayer.addEventListener("pointermove", OnPointer, false);
            this.EventMapLayer.addEventListener("pointerup", OnPointer, false);
            //this.EventMapLayer.addEventListener("gesturedoubletap", (e: PointerEvent) => { this.ScrollManager.OnDoubleTap(e, this); }, false);
            //BackGroundLayer.addEventListener("gesturescale", OnPointer, false);
            $(this.EventMapLayer.parentElement).on('mousewheel', (e: any) => { if (this.IsPointerEnabled) { this.ScrollManager.OnMouseWheel(e, this); } });
        }

        /**
            @method GetCameraScale
            @return {number} Scale of camera. 1.0 for 100%.
        */
        GetCameraScale(): number {
            return this.Scale;
        }

        private static LimitScale(Scale: number): number {
            return Math.max(0.02, Math.min(20.0, Scale));
        }

        /**
            @method SetCameraScale
            @param {number} Scale Scale of camera. 1.0 for 100%.
        */
        SetCameraScale(Scale: number): void {
            this.Scale = ViewportManager.LimitScale(Scale);
            this.UpdateAttr();
        }

        private GetOffsetPageX() {
            return this.CameraCenterPageX - this.CameraGX * this.Scale;
        }

        private GetOffsetPageY() {
            return this.CameraCenterPageY - this.CameraGY * this.Scale;
        }

        private SetOffset(PageX: number, PageY: number): void {
            this.CameraGX = (this.CameraCenterPageX - PageX) / this.Scale;
            this.CameraGY = (this.CameraCenterPageY - PageY) / this.Scale;
            this.UpdateAttr();
        }

        AddOffset(PageX: number, PageY: number): void {
            this.CameraGX -= PageX / this.Scale;
            this.CameraGY -= PageY / this.Scale;
            this.UpdateAttr();
        }

        /**
            @method GetCameraGX
            @return {number} Scale-independent camera X position in GSN. 0 for leftside of topgoal.
        */
        GetCameraGX(): number {
            return this.CameraGX;
        }

        /**
            @method GetCameraGY
            @return {number} Scale-independent camera Y position in GSN. 0 for top of topgoal.
        */
        GetCameraGY(): number {
            return this.CameraGY;
        }

        /**
            @method SetCameraPosition
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
        */
        SetCameraPosition(GX: number, GY: number): void {
            this.SetOffset(this.CameraCenterPageX - GX * this.Scale, this.CameraCenterPageY - GY * this.Scale);
        }

        /**
            Set camera's position and scale one time.
            @method SetCamera
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
            @param {number} Scale Scale of camera. 1.0 for 100%.
        */
        SetCamera(GX: number, GY: number, Scale: number): void {
            this.Scale = Scale;
            this.SetOffset(this.CameraCenterPageX - GX * this.Scale, this.CameraCenterPageY - GY * this.Scale);
        }

        private MoveCamera(GX: number, GY: number, Scale: number): void {
            this.Scale += Scale;
            this.CameraGX += GX;
            this.CameraGY += GY;
            this.UpdateAttr();
        }

        /**
            @method GetCameraPageCenterX
            @return {number} X of camera's vanishing point in web page.
        */
        GetCameraPageCenterX(): number {
            return this.CameraCenterPageX;
        }

        /**
            @method GetCameraPageCenterY
            @return {number} Y of camera's vanishing point in web page.
        */
        GetCameraPageCenterY(): number {
            return this.CameraCenterPageY;
        }

        /**
            Set camera's vanishing point in web page.
            @method SetCameraPageCenter
            @param {number} PageX X of camera's vanishing point in web page.
            @param {number} PageY Y of camera's vanishing point in web page.
        */
        SetCameraPageCenter(PageX: number, PageY: number): void {
            this.CameraCenterPageX = PageX;
            this.CameraCenterPageY = PageY;
        }

        /**
            Calcurate PageX from GX 
            @method PageXFromGX
            @param {number} GX Scale-independent X position in GSN.
            @return {number} PageX for given GX. It is depend on camera's position, scale and vanishing point.
        */
        PageXFromGX(GX: number): number {
            return this.CameraCenterPageX + (GX - this.CameraGX) * this.Scale;
        }

        /**
            Calcurate PageY from GY 
            @method PageYFromGY
            @param {number} GY Scale-independent Y position in GSN.
            @return {number} PageY for given GY. It is depend on camera's position, scale and vanishing point.
        */
        PageYFromGY(GY: number): number {
            return this.CameraCenterPageY + (GY - this.CameraGY) * this.Scale;
        }

        /**
            Calcurate GX from PageX 
            @method GXFromPageX
            @param {number} PageX X position in web page.
            @return {number} GX for given PageX. It is depend on camera's position, scale and vanishing point.
        */
        GXFromPageX(PageX: number): number {
            return (PageX - this.CameraCenterPageX) / this.Scale + this.CameraGX;
        }

        /**
            Calcurate GY from PageY 
            @method GYFromPageY
            @param {number} PageY Y position in web page.
            @return {number} GY for given PageY. It is depend on camera's position, scale and vanishing point.
        */
        GYFromPageY(PageY: number): number {
            return (PageY - this.CameraCenterPageY) / this.Scale + this.CameraGY;
        }

        ConvertRectGlobalXYFromPageXY(PageRect: Rect): Rect {
            var x1 = this.GXFromPageX(PageRect.X);
            var y1 = this.GYFromPageY(PageRect.Y);
            var x2 = this.GXFromPageX(PageRect.X + PageRect.Width);
            var y2 = this.GYFromPageY(PageRect.Y + PageRect.Height);
            return new Rect(x1, y1, x2 - x1, y2 - y1); 
        }

        GetPageWidth(): number {
            return this.PageWidth;
        }

        GetPageHeight(): number {
            return this.PageHeight;
        }

        GetPageCenterX(): number {
            return this.GetPageWidth() * 0.5;
        }

        GetPageCenterY(): number {
            return this.GetPageHeight() * 0.5;
        }

        private AnimationFrameTimerHandle: number = 0;

        /**
            Move camera position relatively and change scale.
            @method Move
            @param {number} GX Scale-independent camera relative X difference.
            @param {number} GY Scale-independent camera relative Y difference.
            @param {number} Scale Scale of camera. 1.0 for 100%.
            @param {number} Duration Time for moving in millisecond.
            @async
        */
        Move(GX: number, GY: number, Scale: number, Duration: number): void {
            this.MoveTo(this.GetCameraGX() + GX, this.GetCameraGY() + GY, Scale, Duration);
        }

        /**
            Move camera position and scale one time.
            @method MoveTo
            @param {number} GX Scale-independent camera X position in GSN. 0 for leftside of topgoal.
            @param {number} GY Scale-independent camera Y position in GSN. 0 for top of topgoal.
            @param {number} Scale Scale of camera. 1.0 for 100%.
            @param {number} Duration Time for moving in millisecond.
            @async
        */
        MoveTo(GX: number, GY: number, Scale: number, Duration: number): void {
            Scale = ViewportManager.LimitScale(Scale);
            if (Duration <= 0) {
                this.SetCamera(GX, GY, Scale);
                return;
            }

            var VX = (GX - this.GetCameraGX()) / Duration;
            var VY = (GY - this.GetCameraGY()) / Duration;

            var S0 = this.GetCameraScale();
            var ScaleRate = Scale / S0;
            var DInv = 1 / Duration;
            var ScaleFunction = (t: number) => { return S0 * Math.pow(ScaleRate, t * DInv); }

            if (VY == 0 && VX == 0 && (Scale == S0)) {
                return;
            }

            if (this.AnimationFrameTimerHandle) {
                cancelAnimationFrame(this.AnimationFrameTimerHandle);
                this.AnimationFrameTimerHandle = 0;
            }

            var lastTime: number = performance.now();
            var startTime = lastTime;

            var update: any = () => {
                var currentTime: number = performance.now();
                var deltaT = currentTime - lastTime;
                if (currentTime - startTime < Duration) {
                    this.AnimationFrameTimerHandle = requestAnimationFrame(update);
                } else {
                    deltaT = Duration - (lastTime - startTime);
                }
                var DeltaS = ScaleFunction(currentTime - startTime) - ScaleFunction(lastTime - startTime);
                this.MoveCamera(VX * deltaT, VY * deltaT, DeltaS);
                lastTime = currentTime;
            }
            update();
        }

        private UpdatePageRect(): void {
            var CameraCenterXRate = this.CameraCenterPageX / this.PageWidth;
            var CameraCenterYRate = this.CameraCenterPageY / this.PageHeight;
            this.PageWidth = window.innerWidth;
            this.PageHeight = window.innerHeight;
            this.SetCameraPageCenter(this.PageWidth * CameraCenterXRate, this.PageHeight * CameraCenterYRate);
        }

        private IsEventMapUpper: boolean = false;
        public SetEventMapLayerPosition(IsUpper: boolean) {
            if (IsUpper && !this.IsEventMapUpper) {
                $(this.ControlLayer).after(this.EventMapLayer);
            } else if (!IsUpper && this.IsEventMapUpper) {
                $(this.ContentLayer).before(this.EventMapLayer);
            }
            this.IsEventMapUpper = IsUpper;
        }

        private static translateA(x: number, y: number): string {
            return "translate(" + x + " " + y + ") ";
        }

        private static scaleA(scale: number): string {
            return "scale(" + scale + ") ";
        }

        private static translateS(x: number, y: number): string {
            return "translate(" + x + "px, " + y + "px) ";
        }

        private static scaleS(scale: number): string {
            return "scale(" + scale + ") ";
        }

        private UpdateAttr(): void {
            var OffsetPageX = this.GetOffsetPageX();
            var OffsetPageY = this.GetOffsetPageY();
            var attr: string = ViewportManager.translateA(OffsetPageX, OffsetPageY) + ViewportManager.scaleA(this.Scale);
            var style: string = ViewportManager.translateS(OffsetPageX, OffsetPageY) + ViewportManager.scaleS(this.Scale);
            this.SVGLayer.setAttribute("transform", attr);
            this.SetTransformToElement(this.ContentLayer, style);
            this.SetTransformToElement(this.ControlLayer, style);

            if (this.OnScroll) {
                this.OnScroll(this);
            }
        }

    }
}
