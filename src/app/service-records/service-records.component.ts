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
  selectedVehicle: string | null = null;
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

  // Feature 1: Search by VIN
  searchByVin(): void {
    const vin = this.vinSearchControl.value?.trim();
    if (!vin) {
      this.searchError = 'Please enter a valid VIN';
      return;
    }

    this.searchLoading = true;
    this.searchError = null;
    this.searchedVehicle = null;

    this.serviceRecordsService.getVehicleWithRecords(vin).subscribe({
      next: (vehicle) => {
        this.searchedVehicle = vehicle;
        this.searchLoading = false;
      },
      error: (error) => {
        this.searchError = 'Vehicle not found or error occurred';
        this.searchLoading = false;
        console.error(error);
      },
    });
  }

  // Feature 2: Load all vehicles for dropdown
  loadAllVehicles(): void {
    this.serviceRecordsService.getAllVehicles().subscribe({
      next: (vehicles) => {
        this.vehicles = vehicles;
      },
      error: (error) => {
        console.error('Error loading vehicles:', error);
      },
    });
  }

  // Feature 2: Handle vehicle selection
  onVehicleSelect(event: any): void {
    const vin = event.value;
    
    if (!vin) {
      this.selectedVehicle = null;
      this.selectedVehicleRecords = [];
      return;
    }

    this.selectedVehicle = vin;
    this.loadRecordsByVin(vin);
  }

  // Load records by VIN
  loadRecordsByVin(vin: string): void {
    this.dropdownLoading = true;
    this.dropdownError = null;

    this.serviceRecordsService.getRecordsByVin(vin).subscribe({
      next: (records) => {
        this.selectedVehicleRecords = records;
        this.dropdownLoading = false;
      },
      error: (error) => {
        this.dropdownError = 'Error loading service records';
        this.dropdownLoading = false;
        console.error(error);
      },
    });
  }

  // Open dialog for creating new record
  openCreateDialog(): void {
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

    const input = {
      vin: this.selectedVehicle,
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

      this.serviceRecordsService.updateRecord(this.selectedRecord.id, updateInput).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Service record updated successfully',
          });
          this.displayDialog = false;
          this.loadRecordsByVin(this.selectedVehicle!);
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
          this.loadRecordsByVin(this.selectedVehicle!);
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
            this.loadRecordsByVin(this.selectedVehicle!);
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

  // Helper methods
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }
}