import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
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
import { ServiceRecordsService } from '../services/service-records.service';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { TooltipModule } from 'primeng/tooltip';

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
    AutoCompleteModule,
    TooltipModule,
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './service-records.component.html',
  styleUrl: './service-records.component.scss',
})
export class ServiceRecordsComponent implements OnInit {
  // AutoComplete
  selectedVehicle: any = null;
  filteredVehicles: any[] = [];
  allVehicles: any[] = [];

  // Vehicle data
  selectedVehicleData: any = null;
  vehicleRecords: any[] = [];

  // Loading states
  recordsLoading = false;
  searchError: string | null = null;

  // for crud
  displayDialog = false;
  isEditMode = false;
  recordForm!: FormGroup;
  selectedRecord: any = null;
  saving = false;

  constructor(
    private serviceRecordsService: ServiceRecordsService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAllVehicles();
    this.initForm();
  }

  // Initialize the form
  initForm(): void {
    this.recordForm = new FormGroup({
      service_type: new FormControl('', Validators.required),
      description: new FormControl('', Validators.required),
      cost: new FormControl(null, [Validators.required, Validators.min(0)]),
      service_date: new FormControl(new Date(), Validators.required),
      mechanic_name: new FormControl('', Validators.required),
    });
  }

  // Load all vehicles for autocomplete
  loadAllVehicles(): void {
    this.serviceRecordsService.getAllVehicles().subscribe({
      next: (vehicles) => {
        this.allVehicles = vehicles;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load vehicles',
        });
      },
    });
  }

  // Filter vehicles for autocomplete
  searchVehicles(event: any): void {
    const query = event.query.toLowerCase();
    this.filteredVehicles = this.allVehicles.filter((vehicle) =>
      vehicle.value.toLowerCase().includes(query)
    );
  }

  // Handle vehicle selection from autocomplete
  onVehicleSelect(event: any): void {
    const selectedVin =
      event.value?.value || event.value?.data?.vin || event.value;

    if (!selectedVin) {
      console.error('Unable to extract VIN from selection:', event.value);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Unable to extract VIN from selection',
      });
      return;
    }

    console.log('[ServiceRecordsComponent] Selected VIN:', selectedVin);

    this.searchError = null;
    this.recordsLoading = true;

    // Get vehicle details with service records
    this.serviceRecordsService.getVehicleWithRecords(selectedVin).subscribe({
      next: (vehicle) => {
        this.selectedVehicleData = vehicle;
        this.vehicleRecords = vehicle.serviceRecords || [];
        this.recordsLoading = false;

        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Vehicle loaded successfully',
        });
      },
      error: (error) => {
        this.searchError = 'Failed to load vehicle details';
        this.recordsLoading = false;
        console.error(error);

        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load vehicle details',
        });
      },
    });
  }

  // Handle clear
  onClear(): void {
    this.selectedVehicle = null;
    this.selectedVehicleData = null;
    this.vehicleRecords = [];
    this.searchError = null;
  }

  // Open dialog for creating new record
  openCreateDialog(): void {
    if (!this.selectedVehicleData) {
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
  }

  // Open dialog for editing existing record
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

  // Save record (create or update)
  saveRecord(): void {
    if (this.recordForm.invalid) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please fill all required fields',
      });
      Object.keys(this.recordForm.controls).forEach((key) => {
        this.recordForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.selectedVehicleData) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No vehicle selected',
      });
      return;
    }

    this.saving = true;
    const formValue = this.recordForm.value;

    const input = {
      vin: this.selectedVehicleData.vin,
      service_type: formValue.service_type,
      description: formValue.description,
      cost: Number(formValue.cost),
      service_date: formValue.service_date.toISOString(),
      mechanic_name: formValue.mechanic_name,
    };

    if (this.isEditMode) {
      // Update existing record
      const updateInput = { ...input };
      delete (updateInput as any).vin;

      this.serviceRecordsService
        .updateRecord(this.selectedRecord.id, updateInput)
        .subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Service record updated successfully',
            });
            this.displayDialog = false;
            this.reloadCurrentVehicle();
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
      // Create new record
      this.serviceRecordsService.createRecord(input).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Service record created successfully',
          });
          this.displayDialog = false;
          this.reloadCurrentVehicle();
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

  // Delete record with confirmation
  deleteRecord(record: any): void {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this ${record.service_type} record?`,
      header: 'Confirm Delete',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.serviceRecordsService.deleteRecord(record.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Service record deleted successfully',
            });
            this.reloadCurrentVehicle();
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

  // Reload current vehicle data
  reloadCurrentVehicle(): void {
    if (this.selectedVehicleData) {
      this.recordsLoading = true;
      this.serviceRecordsService
        .getVehicleWithRecords(this.selectedVehicleData.vin)
        .subscribe({
          next: (vehicle) => {
            this.selectedVehicleData = vehicle;
            this.vehicleRecords = vehicle.serviceRecords || [];
            this.recordsLoading = false;
          },
          error: (error) => {
            console.error('Error reloading vehicle:', error);
            this.recordsLoading = false;
          },
        });
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}
