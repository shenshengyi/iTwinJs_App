import {
  BezierCurve3dH,
  CurvePrimitive,
  LineSegment3d,
  LineString3d,
  Path,
  Point3d,
  Vector3d,
} from "@bentley/geometry-core";
import { ColorDef, Frustum } from "@bentley/imodeljs-common";
import {
  Animator,
  BeButtonEvent,
  BeWheelEvent,
  DecorateContext,
  Decorator,
  EventHandled,
  GraphicType,
  HitDetail,
  IModelApp,
  LocateFilterStatus,
  LocateResponse,
  PrimitiveTool,
  ScreenViewport,
  ViewState3d,
} from "@bentley/imodeljs-frontend";

export async function TeskWalkRound() {
  const vp = IModelApp.viewManager.selectedView!;
  if (!vp.view.isSpatialView) {
    return;
  }
  IModelApp.tools.run(WalkRoundTool.toolId);
}

class MyRoaming implements Animator {
  public static speed: number = 0.1;
  private pathSite: Point3d[] = [];
  private totalTime: number = 0;
  private siteCount: number = 0;
  private currentSiteIndex = 0;
  private frustum: Frustum;
  private previousSite: Point3d | undefined = undefined;
  private height: number = 2.5;
  public constructor(
    public viewport: ScreenViewport,
    private view: ViewState3d,
    public paths: Point3d[]
  ) {
    this.frustum = this.viewport.getFrustum();
    paths.forEach((p) => {
      p.z = this.height;
    });

    let pathCurve = this.getCurve(paths);
    this.initPathParameters(pathCurve);
  }

  private initPathParameters(curve: CurvePrimitive) {
    const pathLength = curve.quickLength();
    this.totalTime = pathLength / MyRoaming.speed;
    const size = this.totalTime / ScreenViewport.animation.time.normal.seconds;
    this.siteCount = Math.ceil(size);
    for (let i = 0; i <= this.siteCount; i++) {
      const p = curve.fractionToPoint(i / this.siteCount);
      this.pathSite.push(p);
    }
  }
  private getCurve(paths: Point3d[]) {
    let pathCurve: BezierCurve3dH | LineString3d;
    const bezierCurve = BezierCurve3dH.create(paths);
    if (bezierCurve) {
      pathCurve = bezierCurve;
    } else {
      pathCurve = LineString3d.create(paths);
    }
    return pathCurve;
  }
  private adjustCameraPosition(site: Point3d) {
    if (!this.viewport.view.isSpatialView) {
      return;
    }
    if (this.previousSite === undefined) {
      this.previousSite = site;
    }
    const eye = this.previousSite;
    const currentAngle = this.view.getLensAngle();

    let line = LineSegment3d.create(this.previousSite, site);
    const target = line.fractionToPoint(100);

    const testParams: any = {
      eye,
      target,
      up: Vector3d.create(0, 0, 1),
      lens: currentAngle,
      front: 100.89,
      back: 101.23,
    };

    this.view.lookAtUsingLensAngle(
      testParams.eye,
      testParams.target,
      testParams.up,
      testParams.lens
    );

    if (!this.viewport.isCameraOn) {
      this.viewport.turnCameraOn();
    }
    this.viewport.setupFromView();
    this.previousSite = site;
  }
  animate(): boolean {
    if (
      this.currentSiteIndex < 0 ||
      this.currentSiteIndex >= this.pathSite.length
    ) {
      return true;
    }
    const target = this.pathSite[this.currentSiteIndex++];
    this.adjustCameraPosition(target);
    if (this.currentSiteIndex >= this.pathSite.length) {
      this.viewport.setupViewFromFrustum(this.frustum);
      if (WalkRoundTool.pathDecorator) {
        IModelApp.viewManager.dropDecorator(WalkRoundTool.pathDecorator);
        WalkRoundTool.pathDecorator = undefined;
      }
      return true;
    } else {
      return false;
    }
  }
  interrupt(): void {
    console.log("停止漫游");
  }
}

export class WalkRoundTool extends PrimitiveTool {
  static pathDecorator: Decorator | undefined = undefined;
  public static toolId = "WalkRoundTool";
  public readonly points: Point3d[] = [];
  public readonly paths: Point3d[] = [];
  public requireWriteableTarget(): boolean {
    return false;
  }
  public onPostInstall() {
    super.onPostInstall();
    this.setupAndPromptForNextAction();
  }
  public setupAndPromptForNextAction(): void {
    IModelApp.notifications.outputPromptByKey("SelectSignalTool run");
  }
  public async filterHit(
    _hit: HitDetail,
    _out?: LocateResponse
  ): Promise<LocateFilterStatus> {
    return LocateFilterStatus.Accept;
  }
  public async onMouseWheel(_ev: BeWheelEvent): Promise<EventHandled> {
    return EventHandled.No;
  }
  public async onDataButtonDown(ev: BeButtonEvent): Promise<EventHandled> {
    if (WalkRoundTool.pathDecorator) {
      IModelApp.viewManager.dropDecorator(WalkRoundTool.pathDecorator);
      WalkRoundTool.pathDecorator = undefined;
    }
    await IModelApp.locateManager.doLocate(
      new LocateResponse(),
      true,
      ev.point,
      ev.viewport,
      ev.inputSource
    );
    this.points.push(ev.point);
    this.paths.push(ev.point);
    return EventHandled.No;
  }
  public async onResetButtonUp(_ev: BeButtonEvent): Promise<EventHandled> {
    WalkRoundTool.pathDecorator = new WalkRoundPathDecorator(this.paths);
    IModelApp.viewManager.addDecorator(WalkRoundTool.pathDecorator);
    const vp = IModelApp.viewManager.selectedView!;
    if (vp.view.isSpatialView()) {
      const view3d = vp.view as ViewState3d;
      const test = new MyRoaming(vp, view3d, this.points);
      vp.setAnimator(test);
    }

    IModelApp.toolAdmin.startDefaultTool();
    return EventHandled.No;
  }

  public onRestartTool(): void {
    const tool = new WalkRoundTool();
    if (!tool.run()) this.exitTool();
  }
}

class WalkRoundPathDecorator implements Decorator {
  public constructor(private poinsts: Point3d[]) {}
  public decorate(context: DecorateContext) {
    this.poinsts.forEach((e) => {
      e.z = 1;
    });
    const overlayBuilder = context.createGraphicBuilder(GraphicType.Scene);
    const polylineColor = ColorDef.from(0, 255, 0, 128);
    overlayBuilder.setSymbology(polylineColor, polylineColor, 10);
    const bezier = BezierCurve3dH.create(this.poinsts);
    if (bezier) {
      const path = Path.create(bezier);
      overlayBuilder.addPath(path);
    } else {
      overlayBuilder.addLineString(this.poinsts);
    }
    context.addDecorationFromBuilder(overlayBuilder);
  }
}
