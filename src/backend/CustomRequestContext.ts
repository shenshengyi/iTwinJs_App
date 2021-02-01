import { BasicAccessToken } from "@bentley/imodelhub-client/lib/imodelbank/IModelBankBasicAuthorizationClient";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";

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
