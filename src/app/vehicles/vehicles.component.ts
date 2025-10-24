import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { vehicle } from './Vehilces.model';
import { InputNumberModule } from 'primeng/inputnumber';
import { FormsModule } from '@angular/forms';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';
import { InputTextModule } from 'primeng/inputtext';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-vehicles',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputNumberModule,
    FormsModule,
    FileUploadModule,
    InputTextModule,
    HttpClientModule,
  ],
  templateUrl: './vehicles.component.html',
  styleUrls: ['./vehicles.component.scss'],
})
export class VehiclesComponent implements OnInit {
  @ViewChild('fileUploader') fileUploader!: FileUpload;

  inputValue: number = 0;
  vehicles: vehicle[] = [];
  uploadedFiles: any[] = [];

  ngOnInit(): void {}

  submitValue(): void {
    console.log('Submitted value:', this.inputValue);
  }

  openFileUploader() {
    if (this.fileUploader) {
      this.fileUploader.choose(); // opens the file dialog
    }
  }

  onUpload(event: any) {
    for (const file of event.files) {
      this.uploadedFiles.push(file);
    }

    console.log('Upload successfull!\n Files: ', this.uploadedFiles);
  }
}
