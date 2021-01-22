import * as path from "path";

const port = Number(process.env.PORT || 3000);

export class AppSettings {
  public static readonly appVersion = "1.0";
  public static readonly gatewayToken = "Basic dGVzdDp0ZXN0";
  public static readonly gatewayUrl = "http://localhost:4000";
  public static readonly shouldShowOutput = true;
  public static readonly tokenKey = "itwin-web";
  public static readonly maxParallelJobs = 5;
  public static readonly autoTileCaching = false;
  public static readonly enableAliCloudTileCache = false;
  public static readonly cacheDir = path.resolve(__dirname, "..", "cache");
  public static readonly dataDir = path.resolve(__dirname, "..", "data");
  public static readonly assetsDir = path.resolve(__dirname, "..", "assets");
  public static readonly extensionDir = path.resolve(
    __dirname,
    "..",
    "extensions"
  );
  public static readonly realityMeshDir = path.resolve(
    __dirname,
    "..",
    "reality-mesh"
  );
  public static readonly realityTilesDir = path.resolve(
    __dirname,
    "..",
    "reality-tiles"
  );
  public static readonly dispatchUrl = `${
    port === 443 ? "https" : "http"
  }://127.0.0.1${port === 80 || port === 443 ? "" : ":" + port}/api/progress/`;
}
