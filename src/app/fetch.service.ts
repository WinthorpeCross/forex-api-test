import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { finalize, map, takeUntil } from 'rxjs/operators';
import { IApiResponse, IRate } from './_models';

const _apiUrl = 'https://api.exchangerate-api.com/v4/latest/';

@Injectable(// { providedIn: 'root' }
)
export class FetchService implements OnDestroy {
  private _subscription = new Subject();
  private readonly _isError$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private readonly _isLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  private readonly _rates$: BehaviorSubject<IRate[]> = new BehaviorSubject<IRate[]>([]);

  constructor(private _httpClient: HttpClient) { }

  public get isError(): Observable<boolean> {
    return this._isError$.asObservable();
  }

  public get isLoading(): Observable<boolean> {
    return this._isLoading$.asObservable();
  }

  public get getRates(): Observable<IRate[]> {
    return this._rates$.asObservable();
  }

  public getData(baseCurrencyCode: string = 'GBP'): void {

    this._isLoading$.next(true);

    this._httpClient.get<IApiResponse>(`${_apiUrl}${baseCurrencyCode}`)
      .pipe(map(data => this._mapToModel(data.rates)), finalize(() => {this._isLoading$.next(false)}), takeUntil(this._subscription))
      //.pipe(map(data => this._mapToModel(data.rates)), finalize(() => { this._isLoading$.next(false) }))
      .subscribe({
        next: (r) => {
          this._rates$.next(r);
        },
        error: (e) => { this._handleError(e); },
        complete: () => { }
      })
  }
  //.pipe(map(data => this._mapToModel(data.rates)),
  // .pipe(map(data => Object.keys(data.rates).map((key) => { // chain tap(f => {console.log(f); console.log(f.rates)}) in pipe to debug
  //   return <IRate>{
  //     code: key,
  //     rate: data.rates[key]
  //   }
  // })),
  //    finalize(() => this._isLoading$.next(false))
  // error handling with catchError is handled by the http interceptor, which retries the request
  // catchError here is like the catch() block:
  // return an Observable to keep the stream 'alive' (returning an error ends the stream)
  // ).subscribe(receivedItems => {
  // success handler function
  // console.log(receivedItems);
  //   this._rates$.next(receivedItems);
  // },
  //  (error => { this._handleError(error);
  // error handler function
  // with the httpInterceptor, it returns String; or
  // without the httpInterceptor, it returns HttpErrorResponse
  //  }),
  //() => {
  // completion handler function
  // This "onCompleted()" callback only fires after the "onSuccess()" has completed.
  // It does not fire after the "onError()" callback...
  // i.e.: completion or error are mutually exclusive.
  // ==> this.loading$.next(false); moved to finalize in pipe
  //  }
  // )


  private _handleError(error: any) {
    this._isError$.next(true);
  }

  // ToDo: what to do in the catch block
  private _mapToModel(data: any): IRate[] {
    try {
      let mappedData = Object.keys(data).map((key) => {
        return <IRate>{
          code: key,
          rate: data[key]
        }
      });
      return mappedData;
    }
    catch (e) {
      // console.log(e);
      return []; //ToDo: what to do here?
    }
  }

  ngOnDestroy(): void {
    //alert('Method not implemented.');
    this._subscription.next('');
    this._subscription.complete();
  }
}