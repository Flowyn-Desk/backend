import type { BaseResponseDto } from "../../application/dto/BaseResponseDto.js";
import type { ServiceResponse } from "./ServiceResponse.js";

export interface IBaseService<TRequestDTO, TResponseDTO extends BaseResponseDto> {
    create(request: TRequestDTO): Promise<ServiceResponse<TResponseDTO>>;
    getByUuid(uuid: string): Promise<ServiceResponse<TResponseDTO>>;
    getAll(): Promise<ServiceResponse<TResponseDTO[]>>;
    update(uuid: string, updates: Partial<TRequestDTO>): Promise<ServiceResponse<TResponseDTO>>;
    delete(uuid: string): Promise<ServiceResponse<TResponseDTO>>;
}