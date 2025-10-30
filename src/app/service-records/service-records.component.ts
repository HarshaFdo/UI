import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Apollo, gql } from 'apollo-angular';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';

const GET_VEHICLE_WITH_RECORDS = gql`
  query GetVehicleWithRecords($vin: String!) {
    getVehicle(vin: $vin) {
      id
      vin
      first_name
      last_name
      car_make
      car_model
      age_of_vehicle
      serviceRecords {
        id
        service_type
        description
        cost
        service_date
        mechanic_name
      }
    }
  }
`;

const GET_ALL_VEHICLES = gql`
  query GetAllVehicles($page: Int!, $limit: Int!) {
    getAllVehicles(page: $page, limit: $limit) {
      data {
        id
        vin
        first_name
        last_name
        car_make
        car_model
      }
    }
  }
`;

const GET_RECORDS_BY_VIN = gql`
  query GetRecordsByVin($vin: String!) {
    serviceRecordsByVin(vin: $vin) {
      id
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

const CREATE_RECORD = gql`
  mutation CreateRecord($input: CreateRecordInput!) {
    createRecord(createRecordInput: $input) {
      id
      vin
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;
const UPDATE_RECORD = gql`
  mutation UpdateRecord($id: String!, $input: UpdateRecordInput!) {
    updateRecord(id: $id, updateRecordInput: $input) {
      id
      service_type
      description
      cost
      service_date
      mechanic_name
    }
  }
`;

const DELETE_RECORD = gql`
  mutation DeleteRecord($id: String!) {
    removeRecord(id: $id) {
      id
    }
  }
`;

@Component({
  selector: 'app-service-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    DropdownModule,
    TableModule,
    MessageModule,
    ProgressSpinnerModule,
    DividerModule,
    DialogModule,
    InputTextareaModule,
    InputNumberModule,
    CalendarModule,
    ConfirmDialogModule,
    ToastModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './service-records.component.html',
  styleUrl: './service-records.component.scss',
})
export class ServiceRecordsComponent implements OnInit {
  // Feature 1 - search by vin
  vinSearchControl = new FormControl('');
  searchedVehicle: any = null;
  searchLoading = false;
  searchError: string | null = null;

  // Feature 2 - dropdown
  vehicles: any[] = [];
  selectedVehicle: any = null;
  selectedVehicleRecords: any[] = [];
  dropdownLoading = false;
  dropdownError: string | null = null;

  // for crud
  displayDialog = false;
  isEditMode = false;
  recordForm!: FormGroup;
  selectedRecord: any = null;
  saving = false;

  constructor(
    private apollo: Apollo,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAllVehicles();
    this.initForm();
  }

  // Initilizing the form
  initForm(): void {
    this.recordForm = new FormGroup({
      service_type: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      cost: new FormControl(null, [Validators.required, Validators.min(0)]),
      service_date: new FormControl(new Date(), Validators.required),
      mechanic_name: new FormControl('', Validators.required),
    });
  }

  // Feature 1
  searchByVin(): void {
    const vin = this.vinSearchControl.value?.trim();
    if (!vin) {
      this.searchError = 'Please enter a valid VIN';
      return;
    }

    this.searchLoading = true;
    this.searchError = null;
    this.searchedVehicle = null;

    this.apollo
      .query({
        query: GET_VEHICLE_WITH_RECORDS,
        variables: { vin },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result: any) => {
          this.searchedVehicle = result.data.getVehicle;
          this.searchLoading = false;
        },
        error: (error) => {
          this.searchError = 'Vehicle not found or error occured';
          this.searchLoading = false;
          console.error(error);
        },
      });
  }

  // Feature 2
  // Load all vehicles for the dropdown
  loadAllVehicles(): void {
    this.apollo
      .query({
        query: GET_ALL_VEHICLES,
        variables: {
          page: 1,
          limit: 1000,
        },
      })
      .subscribe({
        next: (result: any) => {
          console.log('Vehicle loaded:', result);
          this.vehicles = result.data.getAllVehicles.data.map((v: any) => ({
            label: `${v.first_name} ${v.last_name} - ${v.car_make} ${v.car_model} ${v.vin}`,
            value: v.vin,
            data: v,
          }));
        },
        error: (error) => {
          console.error('Error loading vehicles:', error);
        },
      });
  }

  // Feature 2
  // Handle the vehicle selection
  onVehicleSelect(event: any): void {
    console.log('=== onVehicleSelect called ===');
    console.log('Event:', event);
    console.log('Event.value:', event.value);

    const vin = event.value;
    console.log('Selected VIN:', vin);
    if (!vin) {
      this.selectedVehicle = null;
      this.selectedVehicleRecords = [];
      console.log('No VIN, cleared selection');
      return;
    }

    this.selectedVehicle = vin;
    console.log('Set selectedVehicle to:', this.selectedVehicle);
    this.loadRecordsByVin(vin);
  }

  // Load recods by vin
  loadRecordsByVin(vin: string): void {
    this.dropdownLoading = true;
    this.dropdownError = null;

    this.apollo
      .query({
        query: GET_RECORDS_BY_VIN,
        variables: { vin },
        fetchPolicy: 'network-only',
      })
      .subscribe({
        next: (result: any) => {
          console.log('Records result:', result);
          this.selectedVehicleRecords = result.data.serviceRecordsByVin;
          this.dropdownLoading = false;
        },
        error: (error) => {
          console.error('Full error', error);
          this.dropdownError = 'Error loading service records';
          this.dropdownLoading = false;
        },
      });
  }

  // open dialog for new record creating
  openCreateDialog(): void {
    console.log('=== openCreateDialog called ===');
    console.log(
      'Opening create dialog, selected vehicle:',
      this.selectedVehicle
    );

    if (!this.selectedVehicle) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a vehicle first',
      });
      return;
    }

    this.isEditMode = false;
    this.selectedRecord = null;
    this.recordForm.reset({
      service_date: new Date(),
    });
    this.displayDialog = true;

    console.log('Dialog opened, selectedVehicle is:', this.selectedVehicle);
  }

  // Open dialog for editing an existing record
  openEditDialog(record: any): void {
    this.isEditMode = true;
    this.selectedRecord = record;
    this.recordForm.patchValue({
      service_type: record.service_type,
      description: record.description,
      cost: record.cost,
      service_date: new Date(record.service_date),
      mechanic_name: record.mechanic_name,
    });
    this.displayDialog = true;
  }

  // save the record - create & update
  saveRecord(): void {
    if (this.recordForm.invalid) {
      console.log('=== saveRecord called ===');
      console.log('selectedVehicle:', this.selectedVehicle);
      console.log('Form value:', this.recordForm.value);

      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });
      return;
    }

    if (!this.selectedVehicle) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No vehicle selected',
      });
      return;
    }

    this.saving = true;

    const formValue = this.recordForm.value;

    console.log('Form value:', formValue);

    const input = {
      vin: this.selectedVehicle,
      service_type: formValue.service_type,
      description: formValue.description,
      cost: Number(formValue.cost),
      service_date: formValue.service_date.toISOString(),
      mechanic_name: formValue.mechanic_name,
    };

    console.log('Create input:', input);

    if (this.isEditMode) {
      // update the exsisting record
      const updateInput = { ...input };
      delete (updateInput as any).vin;

      console.log('Update input:', updateInput, 'ID:', this.selectedRecord.id);

      this.apollo
        .mutate({
          mutation: UPDATE_RECORD,
          variables: {
            id: this.selectedRecord.id,
            input: updateInput,
          },
        })
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Service record updtaed successfully',
            });
            this.displayDialog = false;
            this.loadRecordsByVin(this.selectedVehicle);
            this.saving = false;
          },
          error: (error) => {
            console.error('Error updating record:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to update service record',
            });
            this.saving = false;
          },
        });
    } else {
      // create a new reocrd
      this.apollo
        .mutate({
          mutation: CREATE_RECORD,
          variables: { input },
        })
        .subscribe({
          next: (result) => {
            console.log('Create result:', result);
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Service record created successfully',
            });
            this.displayDialog = false;
            this.loadRecordsByVin(this.selectedVehicle);
            this.saving = false;
          },
          error: (error) => {
            console.error('Error creating record:', error);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to create service record',
            });
            this.saving = false;
          },
        });
    }
  }
  // delete record with confimation
  deleteRecord(record: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${record.service_type} record?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.apollo
          .mutate({
            mutation: DELETE_RECORD,
            variables: { id: record.id },
          })
          .subscribe({
            next: () => {
              this.messageService.add({
                severity: 'success',
                summary: 'Success',
                detail: 'Service record deleted successfully',
              });
              this.loadRecordsByVin(this.selectedVehicle);
            },
            error: (error) => {
              console.error('Error deleting record:', error);
              this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to delete service record',
              });
            },
          });
      },
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
