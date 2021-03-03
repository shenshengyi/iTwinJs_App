import {
  ClientRequestContext,
  DbResult,
  Id64String,
} from "@bentley/bentleyjs-core";
import { IModelConnection } from "@bentley/imodeljs-frontend";
import {
  ContentSpecificationTypes,
  DefaultContentDisplayTypes,
  DisplayValue,
  Field,
  InstanceKey,
  KeySet,
  NestedContentValue,
  Ruleset,
  RuleTypes,
  Value,
  ValuesDictionary,
} from "@bentley/presentation-common";
import { Presentation } from "@bentley/presentation-frontend";

const RULESET: Ruleset = {
  id: `element-properties`,
  rules: [
    {
      ruleType: RuleTypes.Content,
      specifications: [
        {
          specType: ContentSpecificationTypes.SelectedNodeInstances,
        },
      ],
    },
  ],
};
type PossiblyNestedValues = ValuesDictionary<
  DisplayValue | PossiblyNestedValues | PossiblyNestedValues[]
>;
function getElementKey(
  _imodel: IModelConnection,
  _id: Id64String
): InstanceKey | undefined {
  let key: InstanceKey | undefined;
  const query = `SELECT ECClassId FROM bis.Element e WHERE ECInstanceId = ?`;
  //   imodel.withPreparedStatement(query, (stmt) => {
  //     try {
  //       stmt.bindId(1, id);
  //       if (stmt.step() === DbResult.BE_SQLITE_ROW)
  //         key = {
  //           className: stmt
  //             .getValue(0)
  //             .getClassNameForClassId()
  //             .replace(".", ":"),
  //           id,
  //         };
  //     } catch {}
  //   });
//   const sql = `SELECT ECClassId FROM bis.Element e WHERE ECInstanceId = ${_id}`;
//   for await (const row of _imodel.query(sql)){

//   }
  return key;
}
export async function getContent(
  imodel: IModelConnection,
  elementId: Id64String
): Promise<PossiblyNestedValues> {
  const map = {};

  const key = await getElementKey(imodel, elementId);
  if (!key) return map;

  const content = await Presentation.presentation.getContent({
    imodel,
    rulesetOrId: RULESET,
    descriptor: {
      displayType: DefaultContentDisplayTypes.PropertyPane,
    },
    keys: new KeySet([key]),
  });
  if (!content) return map;

  return mapFieldValues(
    content.descriptor.fields,
    content.contentSet[0].values,
    content.contentSet[0].displayValues
  );
}
function mapFieldValues(
  fields: Field[],
  rawValues: ValuesDictionary<Value>,
  displayValues: ValuesDictionary<DisplayValue>
): PossiblyNestedValues {
  const result: PossiblyNestedValues = {};
  fields.forEach((field) => {
    const rawValue = rawValues[field.name];
    if (!rawValue) {
      result[field.label] = undefined;
      return;
    }
    if (field.isNestedContentField()) {
      const ncValues = rawValue as NestedContentValue[];
      if (!ncValues.length) result[field.label] = undefined;
      else if (ncValues.length === 1)
        result[field.label] = mapFieldValues(
          field.nestedFields,
          ncValues[0].values,
          ncValues[0].displayValues
        );
      else
        result[field.label] = ncValues.map((ncValue) =>
          mapFieldValues(
            field.nestedFields,
            ncValue.values,
            ncValue.displayValues
          )
        );
    } else {
      result[field.label] = displayValues[field.name];
    }
  });
  return result;
}
