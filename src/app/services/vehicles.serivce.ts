import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const GET_ALL_VEHICLES = gql`
  query GetAllVehicles($page: Int!, $limit: Int!) {
    getAllVehicles(page: $page, limit: $limit) {
      data {
        id
        first_name
        last_name
        email
        car_make
        car_model
        vin
        manufactured_date
        age_of_vehicle
      }
      total
      page
      totalPages
    }
  }
`;

const SEARCH_VEHICLES = gql`
  query SearchVehicles($model: String!, $page: Int!, $limit: Int!) {
    searchVehicles(model: $model, page: $page, limit: $limit) {
      data {
        id
        first_name
        last_name
        email
        car_make
        car_model
        vin
        manufactured_date
        age_of_vehicle
      }
      total
      page
      totalPages
    }
  }
`;

const UPDATE_VEHICLE = gql`
  mutation UpdateVehicle($vin: String!, $updateData: UpdateVehicleInput!) {
    updateVehicle(vin: $vin, updateData: $updateData) {
      id
      first_name
      last_name
      email
      car_make
      car_model
      vin
      manufactured_date
      age_of_vehicle
    }
  }
`;

const DELETE_VEHICLE = gql`
  mutation DeleteVehicle($vin: String!) {
    deleteVehicle(vin: $vin)
  }
`;

@Injectable({
  providedIn: 'root'
})
export class VehiclesService {
  constructor(private apollo: Apollo) {}

  getAllVehicles(page: number = 1, limit: number = 100): Observable<any> {
    return this.apollo
      .watchQuery<any>({
        query: GET_ALL_VEHICLES,
        variables: { page, limit },
        fetchPolicy: 'network-only'
      })
      .valueChanges
      .pipe(map((result) => result.data.getAllVehicles));
  }

  searchVehicles(model: string, page: number = 1, limit: number = 100): Observable<any> {
    return this.apollo
      .watchQuery<any>({
        query: SEARCH_VEHICLES,
        variables: { model, page, limit },
        fetchPolicy: 'network-only'
      })
      .valueChanges
      .pipe(map((result) => result.data.searchVehicles));
  }

  updateVehicle(vin: string, updateData: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: UPDATE_VEHICLE,
        variables: { vin, updateData }
      } as any)
      .pipe(map((result: any) => result.data?.updateVehicle));
  }

  deleteVehicle(vin: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: DELETE_VEHICLE,
        variables: { vin }
      } as any)
      .pipe(map((result: any) => result.data?.deleteVehicle));
  }
}