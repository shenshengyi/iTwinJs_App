import { IModelDb, Element, PhysicalObject } from "@bentley/imodeljs-backend";
import {
  compareStringsOrUndefined,
  DbResult,
  Id64String,
} from "@bentley/bentleyjs-core";

import { AspectsData } from "../common/PropertiesRpcInterface";

export function replaceChineseChars(key: string) {
  return key
    .replace(/_+x([0-9,A-F]+)/g, function (w) {
      const h = w.replace(/._+x/g, "0x");
      return String.fromCharCode(Number(h));
    })
    .replace(/_+$/g, "");
}
export interface ElementOverride extends Element {
  model: any;
  category: any;
  geom: any;
}

export interface PropertyMeta {
  propertyName: string;
  propertyLabel: string;
  categoryName?: string;
  categoryLabel?: string;
}

export interface PropertyMetaWithValue extends PropertyMeta {
  value: any;
}

export function getElementProperties(
  db: IModelDb,
  elementId: string,
  wantGeometry: boolean,
  wantBRepData: boolean
) {
  try {
    const element = db.elements.getElement<ElementOverride>({
      id: elementId,
      wantGeometry,
      wantBRepData,
    });

    element.model = db.elements.getElement(element.model);
    element.category = db.elements.getElement(element.category);

    if (wantGeometry && element.geom && element.geom.length) {
      const list: Array<{ label: string; value: any }> = [];

      element.geom.forEach((item: any) => {
        Object.entries<any>(item).forEach(([k, v]) => {
          if (k === "material" && v.materialId) {
            const material = db.elements.getElement(v.materialId);

            list.push({
              label: "material",
              value: material.userLabel || material.code.value || material.id,
            });
          } else {
            list.push({ label: k, value: v });
          }
        });
      });

      element.geom = list.sort((lhs, rhs) =>
        compareStringsOrUndefined(lhs.label, rhs.label)
      );
    }

    const aspects = db.elements
      .getAspects(elementId)
      .filter(
        (a) =>
          a.schemaName === "BisCore" && a.className === "ExternalSourceAspect"
      );

    return { element, aspects };
  } catch (error) {
    return null;
  }
}

export function getAssemblyProperties(db: IModelDb, elementId: string) {
  const assembly = getAssemblyData(db, elementId);
  const aspects = getAspectsData(db, elementId);

  return {
    assembly,
    aspects,
  };
}

function getChildIds(
  ids: Id64String[],
  parentId: Id64String,
  iModel: IModelDb
) {
  const children = iModel.elements.queryChildren(parentId);
  for (const childId of children) {
    ids.push(childId);
    getChildIds(ids, childId, iModel);
  }
}
export function getElementChildIds(db: IModelDb, elementId: string) {
  const ids: Id64String[] = [];
  const sql = "SELECT Parent.Id FROM BisCore.Element WHERE ECInstanceId = ?";

  const parentId = db.withPreparedStatement(sql, (stmt) => {
    stmt.bindString(1, elementId);

    if (stmt.step() === DbResult.BE_SQLITE_ROW) {
      const val = stmt.getValue(0);

      return val.isNull ? null : val.getString();
    }

    return null;
  });

  if (parentId) {
    getChildIds(ids, parentId, db);
  }
  return ids;
}
export function getParentElementId(
  db: IModelDb,
  elementId: string
): string | undefined {
  const sql = "SELECT Parent.Id FROM BisCore.Element WHERE ECInstanceId = ?";

  const parentId = db.withPreparedStatement(sql, (stmt) => {
    stmt.bindString(1, elementId);

    if (stmt.step() === DbResult.BE_SQLITE_ROW) {
      const val = stmt.getValue(0);

      return val.isNull ? null : val.getString();
    }

    return null;
  });

  if (!parentId) {
    return undefined;
  }
  return parentId;
}
export function getDeviceAllChildElements(
  db: IModelDb,
  elementId: string
): string[] {
  const aspects = getOneDeviceAspects(db, elementId);
  if (
    aspects &&
    aspects.length === 2 &&
    aspects[0].children &&
    aspects[0].children.length === 6 &&
    aspects[1].children &&
    aspects[1].children.length === 14
  ) {
    //是设备元素;
    const data = aspects[1].children;
    const value = data.find((e) => {
      return e.name === "deviceName";
    });
    if (value) {
      return getElementChildIds(db, elementId);
    }
  }
  return [];
}
export function getDeviceAspects(db: IModelDb) {
  const ids = db.queryEntityIds({
    from: PhysicalObject.classFullName,
    where: "UserLabel='Smart Solid'",
  });

  const aspectsList: AspectsData[] = [];
  ids.forEach((id) => {
    const aspects = getOneDeviceAspects(db, id);
    if (
      aspects &&
      aspects.length === 2 &&
      aspects[0].children &&
      aspects[0].children.length === 6 &&
      aspects[1].children &&
      aspects[1].children.length === 14
    ) {
      aspectsList.push({
        ElementId: id,
        LevelName: aspects[0],
        AdditionalAttributes: aspects[1],
      });
    }
  });
  return aspectsList;
}

export function getOneDeviceAspects(db: IModelDb, elementId: string) {
  const sql = "SELECT Parent.Id FROM BisCore.Element WHERE ECInstanceId = ?";

  const parentId = db.withPreparedStatement(sql, (stmt) => {
    stmt.bindString(1, elementId);

    if (stmt.step() === DbResult.BE_SQLITE_ROW) {
      const val = stmt.getValue(0);

      return val.isNull ? null : val.getString();
    }

    return null;
  });

  if (!parentId) {
    return null;
  }

  const aspects = getAspectsData(db, parentId);
  return aspects;
}

export function getTopAssemblyProperties(db: IModelDb, elementId: string) {
  const sql = "SELECT Parent.Id FROM BisCore.Element WHERE ECInstanceId = ?";

  const parentId = db.withPreparedStatement(sql, (stmt) => {
    stmt.bindString(1, elementId);

    if (stmt.step() === DbResult.BE_SQLITE_ROW) {
      const val = stmt.getValue(0);

      return val.isNull ? null : val.getString();
    }

    return null;
  });

  if (!parentId) {
    return null;
  }

  const elementProperties = getElementProperties(db, parentId, false, false);
  const assembly = getAssemblyData(db, parentId);
  const aspects = getAspectsData(db, parentId);

  return {
    elementProperties,
    assembly,
    aspects,
  };
}

export function getAssemblyData(db: IModelDb, elementId: string) {
  try {
    const element = db.elements.getElement(elementId);

    const clsFulName = element.getClassMetaData()!.ecclass;

    const classes = getECClasses(db, clsFulName);

    if (!classes.length) {
      return [];
    }

    const propertyMap = new Map<string, PropertyMeta>();

    for (const cls of classes) {
      const [schemaName, className] = cls.split(":");

      if (
        !schemaName ||
        !className ||
        schemaName.startsWith("BisCore") ||
        schemaName.startsWith("Generic")
      ) {
        continue;
      }

      queryPropertyMetaOfECClass(db, propertyMap, schemaName, className);
    }

    const propertyWithValueMap = queryECProperties(
      db,
      clsFulName,
      elementId,
      propertyMap
    );

    return formatData(propertyWithValueMap);
  } catch (error) {
    return null;
  }
}

export function getAspectsData(db: IModelDb, elementId: string) {
  try {
    const aspects = db.elements.getAspects(elementId);

    const list: Array<{ name: string; label: string; children: any[] }> = [];

    for (const Aspect of aspects) {
      if (
        Aspect.schemaName === "BisCore" &&
        Aspect.className === "ExternalSourceAspect"
      ) {
        continue;
      }

      let clsName = Aspect.className;

      const postfix = "ElementAspect";

      if (clsName.endsWith(postfix)) {
        clsName = clsName.substr(0, clsName.length - postfix.length);
      }

      const clsLabel = replaceChineseChars(clsName);

      const children: Array<{ name: string; label: string; value: any }> = [];

      Aspect.forEachProperty((propName) => {
        if (propName.toLowerCase() === "element") {
          return;
        }

        const label = replaceChineseChars(propName);

        children.push({
          name: propName,
          label,
          value: Aspect[propName],
        });
      });

      list.push({ name: clsName, label: clsLabel, children });
    }

    return list.sort((lhs, rhs) =>
      compareStringsOrUndefined(lhs.label, rhs.label)
    );
  } catch (error) {
    return null;
  }
}

export function getECClasses(db: IModelDb, clsFulName: string, only = false) {
  if (clsFulName.startsWith("BisCore") || clsFulName.startsWith("Generic")) {
    return [];
  }

  const classes = [clsFulName];

  if (only) {
    return classes;
  }

  let cls = clsFulName;

  while (true) {
    cls = db.getMetaData(cls).baseClasses[0];

    if (cls !== undefined && !cls.includes("BisCore:")) {
      classes.push(cls);
    } else {
      break;
    }
  }

  return classes;
}

export function queryPropertyMetaOfECClass(
  db: IModelDb,
  propertyMap: Map<string, PropertyMeta>,
  schemaName: string,
  className: string
) {
  // Properties with category.
  const s1 =
    "SELECT p.Name, p.DisplayLabel, c.Name, c.DisplayLabel FROM ONLY ECDbMeta.ECPropertyDef p, ONLY ECDbMeta.ECClassDef cls, ONLY ECDbMeta.ECSchemaDef s, ONLY ECDbMeta.PropertyCategoryDef c WHERE(p.Class.Id = cls.ECInstanceId AND cls.Name = ? AND s.ECInstanceId = cls.Schema.Id AND s.Name = ? AND p.Category.Id = c.ECInstanceId)";

  db.withPreparedStatement(s1, (stmt) => {
    stmt.bindString(1, className);
    stmt.bindString(2, schemaName);

    while (stmt.step() === DbResult.BE_SQLITE_ROW) {
      let val = stmt.getValue(0);

      if (val.isNull) {
        continue;
      }

      const propertyName = val.getString().toLowerCase();

      val = stmt.getValue(1);

      if (val.isNull) {
        continue;
      }

      const propertyLabel = val.getString();

      val = stmt.getValue(2);

      if (val.isNull) {
        continue;
      }

      const categoryName = val.getString().toLowerCase();

      val = stmt.getValue(3);

      const categoryLabel = val.isNull ? categoryName : val.getString();

      propertyMap.set(propertyName, {
        propertyName,
        propertyLabel,
        categoryName,
        categoryLabel,
      });
    }
  });

  // Properties without category.
  const s2 =
    "SELECT p.Name, p.DisplayLabel FROM ONLY ECDbMeta.ECPropertyDef p, ONLY ECDbMeta.ECClassDef c, ONLY ECDbMeta.ECSchemaDef s WHERE (p.Class.Id = c.ECInstanceId AND c.Name = ? AND c.Schema.Id = s.ECInstanceId AND s.Name = ?)";

  db.withPreparedStatement(s2, (stmt) => {
    stmt.bindString(1, className);
    stmt.bindString(2, schemaName);

    while (stmt.step() === DbResult.BE_SQLITE_ROW) {
      let val = stmt.getValue(0);

      if (val.isNull) {
        continue;
      }

      const propertyName = val.getString().toLowerCase();

      val = stmt.getValue(1);

      const propertyLabel = val.isNull ? propertyName : val.getString();

      if (!propertyMap.has(propertyName)) {
        propertyMap.set(propertyName, {
          propertyName,
          propertyLabel,
        });
      }
    }
  });
}

export function queryECProperties(
  db: IModelDb,
  clsFulName: string,
  elementId: string,
  propertyMap: Map<string, PropertyMeta>
) {
  const propertyWithValueMap = new Map<string, PropertyMetaWithValue>();

  const sql = "SELECT * FROM ONLY " + clsFulName + " WHERE ECInstanceId = ?";

  db.withPreparedStatement(sql, (stmt) => {
    stmt.bindString(1, elementId);

    if (stmt.step() === DbResult.BE_SQLITE_ROW) {
      const row = stmt.getRow();

      if (propertyMap.size) {
        setPropertyValueByMap(propertyWithValueMap, propertyMap, row);
      } else {
        setPropertyValueByRow(db, propertyWithValueMap, row, clsFulName);
      }
    }
  });

  return propertyWithValueMap;
}

export function setPropertyValueByMap(
  propertyWithValueMap: Map<string, PropertyMetaWithValue>,
  propertyMap: Map<string, PropertyMeta>,
  row: object
) {
  for (const key in row) {
    const lowerCaseKey = key.toLowerCase();

    if (propertyMap.has(lowerCaseKey)) {
      const meta = propertyMap.get(lowerCaseKey);

      propertyWithValueMap.set(lowerCaseKey, {
        ...meta,
        value: row[key],
      } as any);
    }
  }
}

export function setPropertyValueByRow(
  db: IModelDb,
  propertyWithValueMap: Map<string, PropertyMetaWithValue>,
  row: object,
  clsFulName: string
) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [schemaName, className] = clsFulName.split(":");

  const categoryName = className;
  const categoryLabel = replaceChineseChars(className);

  for (const key in row) {
    if (isECProperty(db, key)) {
      propertyWithValueMap.set(key, {
        propertyName: key,
        propertyLabel: replaceChineseChars(key),
        categoryName,
        categoryLabel,
        value: row[key],
      });
    }
  }
}

export function isECProperty(db: IModelDb, propName: string): boolean {
  if (propName === "id" || propName === "className" || propName === "element") {
    // Exclude them by default.
    return false;
  }

  // If BisCore.Element includes this property, so it is not what we need.
  return db.withPreparedStatement(
    "SELECT COUNT(*) FROM ONLY ECDbMeta.ECPropertyDef p, ONLY ECDbMeta.ECClassDef c, ONLY ECDbMeta.ECSchemaDef s WHERE p.Class.Id = c.ECInstanceId AND c.Name = 'Element' AND s.Name = 'BisCore' AND p.Name = ?",
    (stmt) => {
      stmt.bindString(1, propName);

      if (stmt.step() === DbResult.BE_SQLITE_ROW) {
        return stmt.getValue(0).getInteger() === 0;
      }

      return false;
    }
  );
}

export function formatData(
  propertyWithValueMap: Map<string, PropertyMetaWithValue>
) {
  const list: Array<{
    name: string;
    label: string;
    value?: any;
    children?: any[];
  }> = [];
  const category = new Map<string, string>();
  const data = new Map<
    string,
    Array<{
      name: string;
      label: string;
      value: any;
    }>
  >();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for (const [p, metaWithValue] of propertyWithValueMap) {
    const {
      propertyName,
      propertyLabel,
      categoryName,
      categoryLabel,
      value,
    } = metaWithValue;

    if (categoryName) {
      if (!data.has(categoryName)) {
        data.set(categoryName, []);
        category.set(
          categoryName,
          replaceChineseChars(categoryLabel || categoryName)
        );
      }

      data.get(categoryName)!.push({
        name: propertyName,
        label: replaceChineseChars(propertyLabel),
        value,
      });
    } else {
      list.push({
        name: propertyName,
        label: replaceChineseChars(propertyLabel),
        value,
      });
    }
  }

  for (const [name, children] of data) {
    const label = category.get(name)!;

    list.push({
      name,
      label,
      children: children.sort((lhs, rhs) =>
        compareStringsOrUndefined(lhs.label, rhs.label)
      ),
    });
  }

  return list.sort((lhs, rhs) =>
    compareStringsOrUndefined(lhs.label, rhs.label)
  );
}
