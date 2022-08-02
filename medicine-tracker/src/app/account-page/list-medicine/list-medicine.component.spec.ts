import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListMedicineComponent } from './list-medicine.component';

describe('ListMedicineComponent', () => {
  let component: ListMedicineComponent;
  let fixture: ComponentFixture<ListMedicineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListMedicineComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListMedicineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
