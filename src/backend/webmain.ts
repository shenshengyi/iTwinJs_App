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
import { Logger } from "@bentley/bentleyjs-core";
import {
  IModelHost,
  IModelHostConfiguration,
} from "@bentley/imodeljs-backend";
import { Presentation } from "@bentley/presentation-backend";

import {
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

function getFileHandlerFromConfig() {
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
    const url = "http://localhost:4000";
    config.imodelClient = new IModelBankClient(url, fileHandler);

    // Initialize iModelHost
    await IModelHost.startup(config);
    RpcConfiguration.requestContext.deserialize = parseBasicAccessToken;
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
