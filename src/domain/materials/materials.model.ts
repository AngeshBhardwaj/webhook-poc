import { CloudEvent } from "cloudevents";

export type MaterialCreatedPayload = {
    id: string;
    name: string;
    description: string;
    quantity: number;
  }
  
export type MaterialCreatedEvent = CloudEvent<MaterialCreatedPayload>;
export type MaterialUpdatedEvent = CloudEvent<MaterialCreatedPayload>;


export type CreateMaterialCmd = Command<CreateMaterialPayload>;
export type UpdateMaterialCmd = Command<Partial<MaterialCreatedPayload>>;
// export type CreateMaterialCmd = Command<CreateEvent>;
export type CreateMaterialPayload = {
  name: string;
  description: string;
  quantity: number;  
}

export type CreateMaterialFailures = 'already_exists'
export type UpdateMaterialFailures = 'does_not_exists' | 'invalid_quantity' | 'read_only_field'

export type Command<T> = CloudEvent<T>;

export type Return<T, F> = Success<T> | Failure<F>
export type Success<T> = {_d: "success", data: T}
export type Failure<F> = {_d: "failure", cause: F}

export const fail = <F>(cause: F) => ({_d: "failure", cause})
export const succeed = <T>(data: T) => ({_d: "success", data})
export const isFailure = <T, F>(res: Return<T, F>) => res._d === 'failure'