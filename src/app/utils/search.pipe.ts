import { PipeTransform, Pipe, Injectable } from '@angular/core';

@Pipe({
  standalone: false,
    name: 'search'
})
@Injectable()
export class SearchPipe implements PipeTransform {
    transform(items: any[], field1: string, field2: string, args: string): any {
        return items.filter(item => (item[field1].toString().toLowerCase().indexOf(args.toLowerCase()) !== -1 || item[field2].toString().toLowerCase().indexOf(args.toLowerCase()) !== -1));
    }
}