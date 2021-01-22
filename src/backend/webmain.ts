/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import { IModelJsExpressServer } from "@bentley/express-server";
import {
  BentleyCloudRpcManager,
  RpcConfiguration,
  RpcManager,
} from "@bentley/imodeljs-common";
import { AppLoggerCategory } from "../common/LoggerCategory";
import { ClientRequestContext, Guid, Logger } from "@bentley/bentleyjs-core";
import {
  FileNameResolver,
  IModelHost,
  IModelHostConfiguration,
} from "@bentley/imodeljs-backend";
import { Presentation } from "@bentley/presentation-backend";

import {
  AgentAuthorizationClient,
  AzureFileHandler,
  StorageServiceFileHandler,
} from "@bentley/backend-itwin-client";
import { LocalhostHandler } from "./LocalhostHandler";
import { IModelBankClient } from "@bentley/imodelhub-client";
import { parseBasicAccessToken } from "./BasicAuthorization";
import { getSupportedRpcs } from "../common/rpcs";
import SVTRpcInterface from "../common/SVTRpcInterface";
import SVTRpcImpl from "./SVTRpcImpl";
import { PropertiesRpcImpl, RobotWorldReadRpcImpl } from "./PropertiesRpcImpl";
import { RobotWorldReadRpcInterface } from "../common/PropertiesRpcInterface";
import ExportImp from "./ExportIFCImp";
import {
  BasicAccessToken,
  IModelBankBasicAuthorizationClient,
} from "@bentley/imodelhub-client/lib/imodelbank/IModelBankBasicAuthorizationClient";
import {
  AccessToken,
  AuthorizationClient,
  AuthorizedClientRequestContext,
  UserInfo,
} from "@bentley/itwin-client";
import * as path from "path";
import * as http from "http";
const email = "test";
const password = "test";

export function createRequestContext() {
  return new AuthorizedClientRequestContext(
    BasicAccessToken.fromCredentials({
      email,
      password,
    })
  );
}

function getFileHandlerFromConfig() {
  //const storageType: string = Config.App.get("imjs_imodelbank_storage_type");
  const storageType: string = "localhost";
  switch (storageType) {
    case "azure":
      return new AzureFileHandler();
    case "servicestorage":
      return new StorageServiceFileHandler();
    case "localhost":
    default:
      return new LocalhostHandler();
  }
}

export class MockAccessToken extends AccessToken {
  public constructor() {
    super("");
  }

  public getUserInfo(): UserInfo | undefined {
    const id = "test";
    const email = { id: "test" };
    // const profile = { firstName: "test", lastName: "user" };
    // const organization = { id: "fefac5b-bcad-488b-aed2-df27bffe5786", name: "Bentley" };
    // const featureTracking = { ultimateSite: "1004144426", usageCountryIso: "US" };
    //return new UserInfo(id, email, profile, organization, featureTracking);
    return new UserInfo(id, email);
  }

  public toTokenString() {
    return "";
  }
}

const authorizationClient: AuthorizationClient = {
  getAccessToken: async (
    _requestContext: ClientRequestContext
  ): Promise<AccessToken> => {
    return new MockAccessToken();
  },

  isAuthorized: true,
};
/**
 * Initializes Web Server backend
 */
// function called when we start the backend webserver
const webMain = async () => {
  // tell BentleyCloudRpcManager which RPC interfaces to handle
  try {
    // Initialize iModelHost
    const config = new IModelHostConfiguration();

    // iTwinStack: specify what kind of file handler is used by IModelBankClient
    const fileHandler = getFileHandlerFromConfig();

    // iTwinStack: setup IModelBankClient as imodelClient for IModelHost
    // const url = Config.App.get("imjs_imodelbank_url");
    const url = "http://localhost:4000";
    config.imodelClient = new IModelBankClient(url, fileHandler);

    // Initialize iModelHost
    await IModelHost.startup(config);
    IModelHost.snapshotFileNameResolver = new BackendTestAssetResolver();
    RpcConfiguration.requestContext.deserialize = parseBasicAccessToken;
    //const email = "test";
    //const password = "test";
    //IModelHost.authorizationClient = new IModelBankBasicAuthorizationClient({ id: Guid.createValue() }, { email, password });
    //IModelHost.authorizationClient = authorizationClient;
    // Initialize Presentation
    Presentation.initialize();
    // Get RPCs supported by this backend
    const rpcs = getSupportedRpcs();
    registerRPCImp();
    const rpcConfig = BentleyCloudRpcManager.initializeImpl(
      { info: { title: "itwin-stack-app", version: "v1.0" } },
      rpcs
    );

    const port = Number(process.env.PORT || 3001);
    const server = new IModelJsExpressServer(rpcConfig.protocol);
    await server.initialize(port);
    Logger.logInfo(
      AppLoggerCategory.Backend,
      `RPC backend for ninezone-sample-app listening on port ${port}`
    );

    const serveHandler = require("serve-handler");
    await new Promise((resolve) => {
      http
        .createServer(async (request, response) => {
          return serveHandler(request, response, {
            cleanUrls: false,
            public: "lib",
            headers: [
              {
                source: "*",
                headers: [{ key: "Access-Control-Allow-Origin", value: "*" }],
              },
            ],
          });
        })
        .listen(Number(3001), undefined, undefined, resolve as any);
    });
  } catch (error) {
    Logger.logError(AppLoggerCategory.Backend, error);
    process.exitCode = 1;
  }
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
webMain();

function registerRPCImp() {
  PropertiesRpcImpl.register();
  RpcManager.registerImpl(RobotWorldReadRpcInterface, RobotWorldReadRpcImpl);
  RpcManager.registerImpl(SVTRpcInterface, SVTRpcImpl);
  ExportImp.register();
}

/** A FileNameResolver for resolving test iModel files from core/backend */
class BackendTestAssetResolver extends FileNameResolver {
  /** Resolve a base file name to a full path file name in the core/backend/lib/test/assets/ directory. */
  public tryResolveFileName(inFileName: string): string {
    // if (path.isAbsolute(inFileName)) {
    //   return inFileName;
    // }
    // console.log("202020202");
    // console.log(
    //   path.join(__dirname, "../../backend/lib/test/", inFileName)
    // );
    // return path.join(__dirname, "../../backend/lib/test/", inFileName);
    console.log(inFileName);
    // return path.join(
    //   __dirname,
    //   "../../../../interactive-app/simple-viewer-app/lib/backend/test/",
    //   inFileName
    // );
    return "D:/cim/dd/dian2022.bim";
  }

  /** Resolve a key (for testing FileNameResolver) */
  public tryResolveKey(fileKey: string): string | undefined {
    switch (fileKey) {
      case "test-key":
        return this.tryResolveFileName("test.bim");
      case "test2-key":
        const p = this.tryResolveFileName("dian2022.bim");
        console.log(p);
        return p;
      default:
        return undefined;
    }
  }
  public resolveKey(fileKey: string): string {
    switch (fileKey) {
      case "test-key":
        return this.tryResolveFileName("test.bim");
      case "test2-key":
        const p = this.tryResolveFileName("dian2022.bim");
        console.log(p);
        return p;
    }
    return "";
  }
  public resolveFileName(fileKey: string): string {
    console.log(fileKey);
    return "../../../../lib/backend/test/dian2022.bim";
  }
}
