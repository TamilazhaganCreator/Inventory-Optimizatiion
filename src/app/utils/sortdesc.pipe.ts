import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  standalone: false,
  name: "sort-asc"
})
export class ArrayDescSortPipe implements PipeTransform {
  transform(array: any[], field: string): any[] {
    array.sort((a: any, b: any) => {
      if (a[field] > b[field]) {
        return -1;
      } else if (a[field] < b[field]) {
        return 1;
      } else {
        return 0;
      }
    });
    return array;
  }
}
