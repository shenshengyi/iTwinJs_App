import * as path from "path";
import * as fs from "fs-extra";
import { fork } from "child_process";
import {
  IModelBankClient,
  IModelCreateOptions,
  IModelQuery,
  ChangeSetQuery,
  VersionQuery,
} from "@bentley/imodelhub-client";

import { LocalhostHandler } from "./LocalhostHandler";
import { AppSettings } from "./AppSettings";
import { createRequestContext } from "./CustomRequestContext";


export const bankClient = new IModelBankClient(
  AppSettings.gatewayUrl,
  new LocalhostHandler()
);

export async function createIModel(
  contextId: string,
  name: string,
  createOptions?: IModelCreateOptions
) {
  const requestContext = createRequestContext();

  name = encodeURIComponent(name);

  try {
    return await bankClient.iModels.create(
      requestContext,
      contextId,
      name,
      createOptions
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getIModelByName(contextId: string, name: string) {
  const requestContext = createRequestContext();

  name = encodeURIComponent(name);

  try {
    return await bankClient.iModels.get(
      requestContext,
      contextId,
      new IModelQuery().byName(name)
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getIModelById(contextId: string, iModelId: string) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.iModels.get(
      requestContext,
      contextId,
      new IModelQuery().byId(iModelId)
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getIModels(contextId: string) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.iModels.get(requestContext, contextId);
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function createJobConfig(
  jobDir: string,
  iModelId: string,
  contextId: string
): Promise<boolean> {
  try {
    if (!(await fs.pathExists(jobDir))) {
      await fs.mkdir(jobDir);
    }

    const bridgeAssignExePath = path.resolve(
      AppSettings.assetsDir,
      "imodelbridgeassign",
      "iModelBridgeAssign.exe"
    );

    if (!(await fs.pathExists(bridgeAssignExePath))) {
      return false;
    }

    // configuration.json
    const jobConfig = {
      contextId,
      iModelId,
      storageType: "localhost",
      //storageType: "storageservice",
      accessToken: AppSettings.gatewayToken,
      iModelBankUrl: AppSettings.gatewayUrl,
      assignExe: bridgeAssignExePath,
      isIModelHub: false,
      shouldShowOutput: AppSettings.shouldShowOutput,
      dispatchUrl: AppSettings.dispatchUrl + iModelId,
    };

    await fs.writeFile(
      path.resolve(jobDir, "configuration.json"),
      JSON.stringify(jobConfig),
      "utf8"
    );

    const bridgeArgs = [
      {
        bridge: "IModelBridgeForMstn",
        args: [],
      },
    ];
    await fs.writeFile(
      path.resolve(jobDir, "input/bridgeArgs.json"),
      JSON.stringify(bridgeArgs),
      "utf8"
    );

    // logging.config.xml
    const src = path.resolve(AppSettings.assetsDir, "logging.config.xml");
    const dest = path.resolve(jobDir, "logging.config.xml");

    await fs.copy(src, dest);

    return true;
  } catch (error) {
    // ###TODO log
    console.log(error);
    return false;
  }
}

export function runBridgeJob(
  jobDir: string,
  success: () => Promise<void>,
  rec: (msg: string) => void,
  fail: (msg: string) => Promise<void>
) {
  const args = [path.resolve(jobDir, "configuration.json"), jobDir];

  const modulePath = require.resolve(
    "@bentley/imodel-bank-bridge-job/lib/runBridgeJob"
  );

  const child = fork(modulePath, args);

  child.on("message", async (data: any) => {
    if (data.err) {
      await fail(data.err);
    } else if (!data.done) {
      rec(data.message);
    } else {
      await success();
    }
  });
}

export async function getChangeSets(iModelId: string) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.changeSets.get(
      requestContext,
      iModelId,
      new ChangeSetQuery().latest()
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getNamedVersionByName(
  iModelId: string,
  versionName: string
) {
  const requestContext = createRequestContext();

  versionName = encodeURIComponent(versionName);

  try {
    return await bankClient.versions.get(
      requestContext,
      iModelId,
      new VersionQuery().byName(versionName)
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getNamedVersionByChangeSet(
  iModelId: string,
  changeSetId: string
) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.versions.get(
      requestContext,
      iModelId,
      new VersionQuery().byChangeSet(changeSetId)
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getNamedVersionById(iModelId: string, id: string) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.versions.get(
      requestContext,
      iModelId,
      new VersionQuery().byId(id)
    );
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function getNamedVersions(iModelId: string) {
  const requestContext = createRequestContext();

  try {
    return await bankClient.versions.get(requestContext, iModelId);
  } catch (error) {
    console.log(error);
  }

  return undefined;
}

export async function createNamedVersion(
  iModelId: string,
  changeSetId: string,
  versionName: string,
  description: string
) {
  const requestContext = createRequestContext();

  versionName = encodeURIComponent(versionName);

  try {
    return await bankClient.versions.create(
      requestContext,
      iModelId,
      changeSetId,
      versionName,
      description
    );
  } catch (error) {}

  return undefined;
}
