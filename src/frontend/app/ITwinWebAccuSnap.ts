import {
  SnapMode,
  AccuSnap,
  BeButton,
  InputSource,
  BeButtonEvent,
  HitDetail,
} from "@bentley/imodeljs-frontend";
import { BeEvent } from "@bentley/bentleyjs-core";

export class ITwinWebAccuSnap extends AccuSnap {
  private readonly _activeSnaps: SnapMode[] = [SnapMode.NearestKeypoint];

  public get keypointDivisor() {
    return 2;
  }

  public getActiveSnapModes(): SnapMode[] {
    return this._activeSnaps;
  }

  public setActiveSnapModes(snaps: SnapMode[]): void {
    this._activeSnaps.length = snaps.length;
    for (let i = 0; i < snaps.length; i++) this._activeSnaps[i] = snaps[i];
  }

  public get onDataButtonDown() {
    return this._onDataButtonDown;
  }

  public get onMiddleButtonDown() {
    return this._onMiddleButtonDown;
  }

  public get onResetButtonDown() {
    return this._onResetButtonDown;
  }

  public get onPreButtonDown() {
    return this._onPreButtonDown;
  }

  private _onDataButtonDown = new BeEvent<
    (ev: BeButtonEvent, currHit?: HitDetail) => void
  >();
  private _onMiddleButtonDown = new BeEvent<
    (ev: BeButtonEvent, currHit?: HitDetail) => void
  >();
  private _onResetButtonDown = new BeEvent<
    (ev: BeButtonEvent, currHit?: HitDetail) => void
  >();
  private _onPreButtonDown = new BeEvent<
    (ev: BeButtonEvent, currHit?: HitDetail) => void
  >();

  onPreButtonEvent(ev: BeButtonEvent) {
    if (InputSource.Mouse === ev.inputSource && ev.isDown) {
      this._onPreButtonDown.raiseEvent(ev, this.currHit);

      switch (ev.button) {
        case BeButton.Data:
          this._onDataButtonDown.raiseEvent(ev, this.currHit);
          break;
        case BeButton.Middle:
          this._onMiddleButtonDown.raiseEvent(ev, this.currHit);
          break;
        case BeButton.Reset:
          this._onResetButtonDown.raiseEvent(ev, this.currHit);
          break;
        default:
          break;
      }
    }

    return super.onPreButtonEvent(ev);
  }
}
