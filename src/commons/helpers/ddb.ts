import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";

export interface BaseItem {
  PK: string;
  SK: string;
  userId: string;
}

export function stripBaseItem<T extends BaseItem>(
  item: T
): Omit<T, keyof BaseItem> {
  const { PK, SK, userId, ...rest } = item;
  return rest as Omit<T, keyof BaseItem>;
}

const raw = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(raw);

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

export async function putItem<T extends BaseItem>(
  table: string,
  item: T
): Promise<void> {
  await docClient.send(
    new PutCommand({
      TableName: table,
      Item: stripUndefined(item),
    })
  );
}

export async function queryItems<T extends BaseItem>(
  table: string,
  pk: string,
  skPrefix?: string,
  options?: Omit<
    QueryCommandInput,
    "TableName" | "KeyConditionExpression" | "ExpressionAttributeValues"
  >
): Promise<T[]> {
  const params: QueryCommandInput = {
    TableName: table,
    KeyConditionExpression:
      "PK = :pk" + (skPrefix ? " AND begins_with(SK, :sk)" : ""),
    ExpressionAttributeValues: {
      ":pk": pk,
      ...(skPrefix ? { ":sk": skPrefix } : {}),
    },
    ...options,
  };

  const { Items } = await docClient.send(new QueryCommand(params));
  return (Items as T[]) || [];
}

export async function updateItem<T extends BaseItem>(
  table: string,
  key: Pick<T, "PK" | "SK">,
  updates: Partial<Omit<T, keyof BaseItem>>
): Promise<T> {
  const names: Record<string, string> = {};
  const values: Record<string, any> = {};
  const sets = Object.entries(updates).map(([attr, val], i) => {
    const nameKey = `#n${i}`,
      valKey = `:v${i}`;
    names[nameKey] = attr;
    values[valKey] = val;
    return `${nameKey} = ${valKey}`;
  });

  const { Attributes } = await docClient.send(
    new UpdateCommand({
      TableName: table,
      Key: key,
      UpdateExpression: "SET " + sets.join(", "),
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: values,
      ReturnValues: "ALL_NEW",
    })
  );
  return Attributes as T;
}

/**
 * Delete an item from DynamoDB
 * @param table The table name
 * @param key The key of the item to delete
 * @returns Promise that resolves when the item is deleted
 */
export async function deleteItem(
  table: string,
  key: { PK: string; SK: string }
): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: table,
      Key: key,
    })
  );
}
