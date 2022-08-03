import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountPageRoutingModule } from './account-page-routing.module';
import { AddMedicineComponent } from './add-medicine/add-medicine.component';
import { EditMedicineComponent } from './edit-medicine/edit-medicine.component';
import { ListMedicineComponent } from './list-medicine/list-medicine.component';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';



@NgModule({
  declarations: [
    AddMedicineComponent,
    EditMedicineComponent,
    ListMedicineComponent
  ],
  imports: [
    CommonModule,
    AccountPageRoutingModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class AccountPageModule { }
