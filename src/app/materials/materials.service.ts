import { MaterialCreatedEvent, CreateMaterialCmd, CreateMaterialFailures, fail, MaterialCreatedPayload, succeed, Success, Failure } from '../../domain/materials/materials.model'
import { v4 as uuidv4 } from 'uuid';
import { DomainTrace, domainTraceFromMsg, createEvent } from '../../infra/events/event.publisher';

let materials: MaterialCreatedPayload[] = [];

export class MaterialsService {
  getAll(): MaterialCreatedPayload[] {
    return materials;
  }

  getById(id: string): MaterialCreatedPayload | undefined {
    return materials.find(material => material.id === id);
  }

  create(material: CreateMaterialCmd): Success<MaterialCreatedEvent> | Failure<CreateMaterialFailures> {
    const exists = !!materials.find(m => m.name);
    if(exists){
      return fail('already_exists') as Failure<CreateMaterialFailures>;
    }

    let materialToAdd: MaterialCreatedPayload = {
      id: '',
      ...material.data!
    }
    materialToAdd.id = uuidv4();
    materials.push(materialToAdd);
    const materialCreatedPayload: MaterialCreatedPayload = materialToAdd;

    const domainTrace: DomainTrace = domainTraceFromMsg(material)
    const materialCreatedEvent: MaterialCreatedEvent = createEvent('material-created')(materialCreatedPayload)(domainTrace) as MaterialCreatedEvent;
    return succeed(materialCreatedEvent) as Success<MaterialCreatedEvent>;
  }

  update(id: string, updatedMaterial: Partial<MaterialCreatedPayload>): MaterialCreatedPayload | undefined {
    const index = materials.findIndex(material => material.id === id);
    if (index !== -1) {
      materials[index] = { ...materials[index], ...updatedMaterial };
      return materials[index];
    }
    return undefined;
  }

  delete(id: string): boolean {
    const index = materials.findIndex(material => material.id === id);
    if (index !== -1) {
      materials.splice(index, 1);
      return true;
    }
    return false;
  }
}
