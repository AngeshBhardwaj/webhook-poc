import { MaterialCreatedEvent, CreateMaterialCmd, Return, CreateMaterialFailures, fail, MaterialCreatedPayload } from '../../domain/materials/materials.model'
import { v4 as uuidv4 } from 'uuid';

let materials: Material[] = [];

export class MaterialsService {
  getAll(): Material[] {
    return materials;
  }

  getById(id: string): Material | undefined {
    return materials.find(material => material.id === id);
  }

  create(material: CreateMaterialCmd): Return<MaterialCreatedEvent, CreateMaterialFailures> {
    const exists = !!materials.find(m => m.name);
    if(exists){
      return fail('already_exists')
    }

    materials.push(material);
    const id = uuidv4(); 
    const materialCreatedPayload: MaterialCreatedPayload = {
      ...material.data, id
    }

    const domainTrace: DomainTrace = domainTraceFromMsg(createMaterialCmd)
    const materialCreatedEvent: MaterialCreatedEvent = createEvent('material-created')(materialCreatedPayload)(domainTrace)
    return succeed(materialCreatedEvent);
  }

  update(id: string, updatedMaterial: Partial<Material>): Material | undefined {
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
