///<reference path='./AssureNote.ts'/>
///<reference path='./CommandLine.ts'/>
///<reference path='./SearchNode.ts'/>
///<reference path='./LayoutEngine.ts'/>
///<reference path='./Editor.ts'/>
///<reference path='./NodeView.ts'/>
///<reference path='./AssureNoteUtils.ts'/>
///<reference path='../d.ts/codemirror.d.ts'/>

///<reference path='../plugin/FullScreenEditor/FullScreenEditor.ts'/>

module AssureNote {

    export class GSNShape {
        ShapeGroup: SVGGElement;
        ArrowPath: SVGPathElement;
        Content: HTMLElement;
        ColorClassName: string = ColorStyle.Default;
        private NodeWidth: number;
        private NodeHeight: number;
        private HeadBoundingBox: Rect; // Head is the node and Left and Right.
        private TreeBoundingBox: Rect; // Tree is Head and Children
        private static ArrowPathMaster: SVGPathElement = null;

        constructor(public NodeView: NodeView) {
            this.Content = null;
            this.NodeWidth = 250;
            this.NodeHeight = 0;
            this.HeadBoundingBox = new Rect(0, 0, 0, 0);
            this.TreeBoundingBox = new Rect(0, 0, 0, 0);
        }

        private static CreateArrowPath(): SVGPathElement {
            if (!GSNShape.ArrowPathMaster) {
                GSNShape.ArrowPathMaster = AssureNoteUtils.CreateSVGElement("path");
                GSNShape.ArrowPathMaster.setAttribute("marker-end", "url(#Triangle-black)");
                GSNShape.ArrowPathMaster.setAttribute("fill", "none");
                GSNShape.ArrowPathMaster.setAttribute("stroke", "gray");
                GSNShape.ArrowPathMaster.setAttribute("d", "M0,0 C0,0 0,0 0,0");
                GSNShape.ArrowPathMaster.setAttribute("d", "M0,0 C0,0 0,0 0,0");
            }
            return <SVGPathElement>GSNShape.ArrowPathMaster.cloneNode();
        }

        SetTreeSize(Width: number, Height: number): void {
            this.TreeBoundingBox.Width = Width;
            this.TreeBoundingBox.Height = Height;
        }

        SetHeadSize(Width: number, Height: number): void {
            this.HeadBoundingBox.Width = Width;
            this.HeadBoundingBox.Height = Height;
        }

        GetNodeWidth(): number {
            return this.NodeWidth;
        }

        GetNodeHeight(): number {
            if (this.NodeHeight == 0) {
                this.NodeHeight = this.Content.clientHeight;
            }
            return this.NodeHeight;
        }

        GetTreeWidth(): number {
            if (this.TreeBoundingBox.Width == 0) {
                this.TreeBoundingBox.Width = 250; //FIXME
            }
            return this.TreeBoundingBox.Width;
        }

        GetTreeHeight(): number {
            if (this.TreeBoundingBox.Height == 0) {
                this.TreeBoundingBox.Height = 100; //FIXME
            }
            return this.TreeBoundingBox.Height;
        }

        GetHeadWidth(): number {
            if (this.HeadBoundingBox.Width == 0) {
                this.HeadBoundingBox.Width = 250; //FIXME
            }
            return this.HeadBoundingBox.Width;
        }

        GetHeadHeight(): number {
            if (this.HeadBoundingBox.Height == 0) {
                this.HeadBoundingBox.Height = 100; //FIXME
            }
            return this.HeadBoundingBox.Height;
        }

        GetTreeLeftX(): number {
            return this.TreeBoundingBox.X;
        }

        GetHeadLeftX(): number {
            return this.HeadBoundingBox.X;
        }

        SetTreeUpperLeft(X: number, Y: number): void {
            this.TreeBoundingBox.X = X;
            this.TreeBoundingBox.Y = Y;
        }

        SetHeadUpperLeft(X: number, Y: number): void {
            this.HeadBoundingBox.X = X;
            this.HeadBoundingBox.Y = Y;
        }

        UpdateHtmlClass() {
            this.Content.className = "node";
        }

        private PrerenderHTMLContent(manager: PluginManager): void {
            if (this.Content == null) {
                var div = document.createElement("div");
                this.Content = div;

                div.style.position = "absolute";
                div.id = this.NodeView.Label;

                var h4 = document.createElement("h4");
                h4.textContent = this.NodeView.Label;

                var p = document.createElement("p");
                p.innerHTML = manager.InvokeHTMLRenderPlugin(this.NodeView.NodeDoc.trim(), this.NodeView.Model);
                this.UpdateHtmlClass();
                div.appendChild(h4);
                div.appendChild(p);
            }
        }

        PrerenderContent(manager: PluginManager) {
            this.PrerenderHTMLContent(manager);
            this.PrerenderSVGContent();
        }

        Render(HtmlContentFragment: DocumentFragment, SvgNodeFragment: DocumentFragment, SvgConnectionFragment: DocumentFragment): void {
            SvgNodeFragment.appendChild(this.ShapeGroup);
            if (this.ArrowPath != null && this.NodeView.Parent != null) {
                SvgConnectionFragment.appendChild(this.ArrowPath);
            }
            HtmlContentFragment.appendChild(this.Content);
        }

        FitSizeToContent(): void {
        }

        private GX = null;
        private GY = null;

        private static CSSAnimationDefinitionCount = 0;
        private static GetCSSAnimationID(): number {
            return GSNShape.CSSAnimationDefinitionCount++;
        }

        private PreviousAnimateElement: SVGElement = null;
        private PreviousArrowAnimateElement: SVGElement = null;

        private RemoveAnimateElement(Animate: SVGElement) {
            if (Animate) {
                var Parent = Animate.parentNode;
                if (Parent) {
                    Parent.removeChild(Animate);
                }
            }
        }

        SetPosition(x: number, y: number, Duration?: number, CSSAnimationBuffer?: string[]): void {
            if (this.NodeView.IsVisible) {
                var div = this.Content;
                if (div != null) {
                    div.style.left = x + "px";
                    div.style.top = y + "px";
                    if (Duration > 0) {
                        var AnimationName: string = "GSNNodeCSSAnim" + GSNShape.GetCSSAnimationID();
                        if (this.PreviousAnimateElement) {
                            this.RemoveAnimateElement(this.PreviousAnimateElement);
                            this.PreviousAnimateElement = null
                        }
                        var AnimationStyleString = AnimationName + " " + Duration / 1000 + "s ease-out";
                        this.Content.style["animation"] = AnimationStyleString;
                        this.Content.style["MozAnimation"] = AnimationStyleString;
                        this.Content.style["webkitAnimation"] = AnimationStyleString;
                        this.Content.style["msAnimation"] = AnimationStyleString;
                        var AnimateElement: any;
                        if (this.GX == null || this.GY == null) {
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSFadeinAnimationDefinition("-webkit-", AnimationName));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSFadeinAnimationDefinition("-moz-", AnimationName));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSFadeinAnimationDefinition("-ms-", AnimationName));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSFadeinAnimationDefinition("", AnimationName));
                            AnimateElement = AssureNoteUtils.CreateSVGFadeinAnimateElement(Duration);
                        } else {
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSMoveAnimationDefinition("-webkit-", AnimationName, this.GX, this.GY));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSMoveAnimationDefinition("-moz-", AnimationName, this.GX, this.GY));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSMoveAnimationDefinition("-ms-", AnimationName, this.GX, this.GY));
                            CSSAnimationBuffer.push(AssureNoteUtils.CreateCSSMoveAnimationDefinition("", AnimationName, this.GX, this.GY));
                            AnimateElement = AssureNoteUtils.CreateSVGMoveAnimateElement(Duration, this.GX - x, this.GY - y);
                        }
                        this.ShapeGroup.appendChild(AnimateElement);
                        AnimateElement.beginElement();
                        this.PreviousAnimateElement = AnimateElement;
                    }
                }
                var mat = this.ShapeGroup.transform.baseVal.getItem(0).matrix;
                mat.e = x;
                mat.f = y;
            }
            this.GX = x;
            this.GY = y;
        }

        ClearAnimationCache(): void {
            this.GX = null;
            this.GY = null;
            if (this.Content) {
                this.Content.style.removeProperty("animation");
                this.Content.style.removeProperty("MozAnimation");
                this.Content.style.removeProperty("webkitAnimation");
                this.Content.style.removeProperty("msAnimation");
            }
            if (this.PreviousAnimateElement) {
                this.RemoveAnimateElement(this.PreviousAnimateElement);
                this.PreviousAnimateElement = null
            }
            if (this.PreviousArrowAnimateElement) {
                this.RemoveAnimateElement(this.PreviousArrowAnimateElement);
                this.PreviousArrowAnimateElement = null
            }
        }

        PrerenderSVGContent(): void {
            this.ShapeGroup = AssureNoteUtils.CreateSVGElement("g");
            this.ShapeGroup.setAttribute("transform", "translate(0,0)");
            this.ArrowPath = GSNShape.CreateArrowPath();
        }

        private OldArrowPath: string;

        SetArrowPosition(P1: Point, P2: Point, Dir: Direction, Duration?: number) {
            var start = <SVGPathSegMovetoAbs>this.ArrowPath.pathSegList.getItem(0);
            var curve = <SVGPathSegCurvetoCubicAbs>this.ArrowPath.pathSegList.getItem(1);
            start.x = P1.X;
            start.y = P1.Y;
            curve.x = P2.X;
            curve.y = P2.Y;
            if (Dir == Direction.Bottom || Dir == Direction.Top) {
                var DiffX = Math.abs(P1.X - P2.X);
                curve.x1 = (9 * P1.X + P2.X) / 10;
                curve.y1 = P2.Y;
                curve.x2 = (9 * P2.X + P1.X) / 10;
                curve.y2 = P1.Y;
                if (DiffX > 300) {
                    curve.x1 = P1.X - 10 * (P1.X - P2.X < 0 ? -1 : 1);
                    curve.x2 = P2.X + 10 * (P1.X - P2.X < 0 ? -1 : 1);
                }
                if (DiffX < 50) {
                    curve.y1 = curve.y2 = (P1.Y + P2.Y) * 0.5;
                }
            } else {
                curve.x1 = (P1.X + P2.X) / 2;
                curve.y1 = (9 * P1.Y + P2.Y) / 10;
                curve.x2 = (P1.X + P2.X) / 2;
                curve.y2 = (9 * P2.Y + P1.Y) / 10;
            }
            if (Duration > 0) {

                var NewPath = this.ArrowPath.getAttribute("d");
                if (this.PreviousArrowAnimateElement) {
                    this.RemoveAnimateElement(this.PreviousArrowAnimateElement);
                    this.PreviousArrowAnimateElement = null
                }
                if (this.GX == null || this.GY == null) {
                    var AnimateElement: any = AssureNoteUtils.CreateSVGFadeinAnimateElement(Duration);
                } else {
                    var AnimateElement: any = AssureNoteUtils.CreateSVGArrowAnimateElement(Duration, this.OldArrowPath, NewPath);
                }

                this.ArrowPath.appendChild(AnimateElement);
                AnimateElement.beginElement();
                this.PreviousArrowAnimateElement = AnimateElement;
                this.OldArrowPath = NewPath;
            }
        }

        SetArrowColorWhite(IsWhite: boolean) {
            if (IsWhite) {
                this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            } else {
                this.ArrowPath.setAttribute("marker-end", "url(#Triangle-black)");
            }
        }

        GetConnectorPosition(Dir: Direction): Point {
            switch (Dir) {
                case Direction.Right:
                    return new Point(this.GetNodeWidth(), this.GetNodeHeight() / 2);
                case Direction.Left:
                    return new Point(0, this.GetNodeHeight() / 2);
                case Direction.Top:
                    return new Point(this.GetNodeWidth() / 2, 0);
                case Direction.Bottom:
                    return new Point(this.GetNodeWidth() / 2, this.GetNodeHeight());
                default:
                    return new Point(0, 0);
            }
        }
    }

    export class GSNGoalShape extends GSNShape {
        BodyRect: SVGRectElement;
        ModuleRect: SVGRectElement;
        UndevelopedSymbol: SVGPolygonElement;

        PrerenderSVGContent(): void {
            super.PrerenderSVGContent();
            this.BodyRect = AssureNoteUtils.CreateSVGElement("rect");
            this.BodyRect.setAttribute("class", this.ColorClassName);
            this.ShapeGroup.appendChild(this.BodyRect);
            if (this.NodeView.IsFolded) {
                this.ModuleRect = AssureNoteUtils.CreateSVGElement("rect");
                this.ModuleRect.setAttribute("class", this.ColorClassName);
                this.ModuleRect.setAttribute("width", "80px");
                this.ModuleRect.setAttribute("height", "13px");
                this.ModuleRect.setAttribute("y", "-13px");
                this.ShapeGroup.appendChild(this.ModuleRect);
            }
            if (this.NodeView.Children == null && !this.NodeView.IsFolded) {
                this.UndevelopedSymbol = AssureNoteUtils.CreateSVGElement("polygon");
                this.UndevelopedSymbol.setAttribute("points", "0 -20 -20 0 0 20 20 0");
                this.UndevelopedSymbol.setAttribute("class", this.ColorClassName);
                this.ShapeGroup.appendChild(this.UndevelopedSymbol);
            }
        }

        FitSizeToContent(): void {
            this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
            this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
            if (this.NodeView.Children == null && !this.NodeView.IsFolded) {
                var x = (this.GetNodeWidth() / 2).toString();
                var y = (this.GetNodeHeight() + 20).toString();
                this.UndevelopedSymbol.setAttribute("transform", "translate(" + x + "," + y + ")");
                this.UndevelopedSymbol.setAttribute("y", y + "px");
            }
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-goal";
        }

    }

    export class GSNContextShape extends GSNShape {
        BodyRect: SVGRectElement;

        PrerenderSVGContent(): void {
            super.PrerenderSVGContent();
            this.BodyRect = AssureNoteUtils.CreateSVGElement("rect");
            this.BodyRect.setAttribute("class", this.ColorClassName);
            this.ArrowPath.setAttribute("marker-end", "url(#Triangle-white)");
            this.BodyRect.setAttribute("rx", "10");
            this.BodyRect.setAttribute("ry", "10");
            this.ShapeGroup.appendChild(this.BodyRect);
        }

        FitSizeToContent(): void {
            this.BodyRect.setAttribute("width", this.GetNodeWidth().toString());
            this.BodyRect.setAttribute("height", this.GetNodeHeight().toString());
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-context";
        }

    }

    export class GSNStrategyShape extends GSNShape {
        BodyPolygon: SVGPolygonElement;
        delta: number = 20;

        PrerenderSVGContent(): void {
            super.PrerenderSVGContent();
            this.BodyPolygon = AssureNoteUtils.CreateSVGElement("polygon");
            this.BodyPolygon.setAttribute("class", this.ColorClassName);
            this.ShapeGroup.appendChild(this.BodyPolygon);
        }

        FitSizeToContent(): void {
            var w: number = this.GetNodeWidth();
            var h: number = this.GetNodeHeight();
            this.BodyPolygon.setAttribute("points", "" + this.delta + ",0 " + w + ",0 " + (w - this.delta) + "," + h + " 0," + h);
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-strategy";
        }

        GetConnectorPosition(Dir: Direction): Point {
            switch (Dir) {
                case Direction.Right:
                    return new Point(this.GetNodeWidth() - this.delta / 2, this.GetNodeHeight() / 2);
                case Direction.Left:
                    return new Point(this.delta / 2, this.GetNodeHeight() / 2);
                case Direction.Top:
                    return new Point(this.GetNodeWidth() / 2, 0);
                case Direction.Bottom:
                    return new Point(this.GetNodeWidth() / 2, this.GetNodeHeight());
            }
        }


    }

    export class GSNEvidenceShape extends GSNShape {
        BodyEllipse: SVGEllipseElement;

        PrerenderSVGContent(): void {
            super.PrerenderSVGContent();
            this.BodyEllipse = AssureNoteUtils.CreateSVGElement("ellipse");
            this.BodyEllipse.setAttribute("class", this.ColorClassName);
            this.ShapeGroup.appendChild(this.BodyEllipse);
        }

        GetNodeHeight(): number {
            if (this["NodeHeight"] == 0) {
                this["NodeHeight"] = Math.max(this.Content.clientHeight, this.GetNodeWidth());
            }
            return this["NodeHeight"];
        }

        FitSizeToContent(): void {
            this.BodyEllipse.setAttribute("cx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("cy", (this.GetNodeHeight() / 2).toString());
            this.BodyEllipse.setAttribute("rx", (this.GetNodeWidth() / 2).toString());
            this.BodyEllipse.setAttribute("ry", (this.GetNodeHeight() / 2).toString());
        }

        UpdateHtmlClass() {
            this.Content.className = "node node-evidence";
        }
    }
}