import {Component, OnInit} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
declare var jQuery: any;
import {DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-in-progress',
	templateUrl: 'ua-in-progress.html',
  directives: [[DROPDOWN_DIRECTIVES, TAB_DIRECTIVES, AlertComponent, ROUTER_DIRECTIVES]]
})


export class InProgressComponent implements OnInit {
  alerts: Array<Object>;
  annotation: any = null;
  liked: boolean = false;
  routerOnActivate(curr: RouteSegment) {
    if (curr.getParam('id'))
      localStorage.setItem('uaAnnotation', curr.getParam('id'));
    if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    }
    this.gotoAnnotation(localStorage.getItem('uaAnnotation'), 0);
  }
  jumpToAnnotation( annotationID: number ) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  constructor( private _router: Router, private _http: Http) { }
  gotoAnnotation( annotationID: number, scrollPosition: number ) {
    let scope = this;
    if (annotationID === null)
      return;
    this.alerts = [];
    localStorage.setItem('uaAnnotation', '' + annotationID);
    jQuery('.add-bar').hide();
    let initializeAnnotation = function (data:any) {
      scope.annotation = data;
      if (data.status !== 2) {
        jQuery('.add-bar').show();
      }
      // Look up phenotype names
      let loadedName = function(datum: any) {
        for (let i = 0; i < data.phenotypes.length; i++) {
          if (data.phenotypes[i].hpo === datum.id) {
            data.phenotypes[i].phenotypeName = datum.name;
            data.phenotypes[i].phenotypeDefinition = datum.def;
          }
        }
        scope.annotation = data;
      };
      for (let i = 0; i < data.phenotypes.length; i++) {
        let body = JSON.stringify({
          'phenotypeName': data.phenotypes[i].hpo
        });
        scope._http.post(globals.backendURL + '/definition', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedName(data),
            err => console.log(err),
            () => console.log('Got name')
          );
      }
      // Look up refs
      let loadedRef = function(datum: any) {
        for (let i = 0; i < data.refs.length; i++) {
          if (String(data.refs[i].pmid) === datum.pmid) {
            data.refs[i].title = datum.title;
            data.refs[i].author = datum.author;
            data.refs[i].year = datum.year;
          }
        }
        scope.annotation = data;
      };
      for (let i = 0; i < data.refs.length; i++) {
        let body = JSON.stringify({
          'pmid': data.refs[i].pmid
        });
        scope._http.post(globals.backendURL + '/efetch', body, globals.options)
          .map(res => res.json())
          .subscribe(
            data => loadedRef(data),
            err => console.log(err),
            () => console.log('Got ref')
          );
      }
      document.documentElement.scrollTop = document.body.scrollTop = scrollPosition;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': annotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeAnnotation(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Invalid annotation',
          closable: true
        }),
        () => console.log('Got full annotation')
      );
  }
  ngOnInit():any {
    let scope = this;
    let display: string;
    jQuery('.js-typeahead').typeahead({
      dynamic: true,
      filter: false,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/solr/hpo/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedPhenotype = function() {
            scope.gotoAnnotation(scope.annotation.annotationID, document.documentElement.scrollTop || document.body.scrollTop);
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'phenotypeName': item.display
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedPhenotype(),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add phenotype. Has it already been added?',
                closable: true
              }),
              () => console.log('Added phenotype')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading definition…');
          jQuery('.hover-box').show();
          let loadedDefinition = function(data: any) {
            if (data.name === display && scope.annotation.status === 0) {
              jQuery('.hover-box').html(data.def);
            } else if (data.name === display) {
              jQuery('.hover-box').html('<strong>' + data.id + '</strong><br />' + data.def);
            }
          };
          let body = JSON.stringify({
            'phenotypeName': item.display
          });
          display = item.display;
          scope._http.post(globals.backendURL + '/definition', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedDefinition(data),
              err => console.log(err),
              () => console.log('Got definition')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.js-typeahead-ref').typeahead({
      dynamic: true,
      filter: false,
      source: {
        phenotypes: {
          ajax: {
            url: globals.backendURL + '/entrez/' + '{{query}}',
            path: 'matches'
          }
        }
      },
      selector: {
        list: 'typeahead__list_annotator'
      },
      callback: {
        onClickAfter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
          scope.alerts = [];
          let addedRef = function(data) {
            scope.annotation.refs.push({
              refID: data.refID,
              pmid: data.pmid,
              title: data.title,
              author: data.author,
              year: data.year
            });
          };
          let body = JSON.stringify({
            'token': localStorage.getItem('uaToken'),
            'annotationID': scope.annotation.annotationID,
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          scope._http.post(globals.backendURL + '/restricted/annotation/edit/ref/add', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => addedRef(data),
              err => scope.alerts.push({
                type: 'danger',
                msg: 'Cannot add reference. Has it already been added?',
                closable: true
              }),
              () => console.log('Added ref')
            );
        },
        onMouseEnter: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').text('Loading metadata…');
          jQuery('.hover-box').show();
          let loadedMetadata = function(data: any) {
            if (data.pmid === display) {
              jQuery('.hover-box').html('<strong>' + data.author + ' (' + data.year + ')</strong><br />' + data.title);
            }
          };
          let body = JSON.stringify({
            'pmid': item.display.substr(0, item.display.indexOf(' '))
          });
          display = item.display.substr(0, item.display.indexOf(' '));
          scope._http.post(globals.backendURL + '/efetch', body, globals.options)
            .map(res => res.json())
            .subscribe(
              data => loadedMetadata(data),
              err => console.log(err),
              () => console.log('Got metadata')
            );
        },
        onMouseLeave: function (node: any, a: any, item: any, event: any) {
          jQuery('.hover-box').hide();
        }
      }
    });
    jQuery('.add-bar').hide();
    jQuery(document).on('mousemove', function(e: any){
      jQuery('.hover-box').css({
        left:   e.clientX - 320,
        bottom: window.innerHeight - e.clientY
      });
    });
  }
  setObserved(phenotypeID: number, observed: boolean) {
    let scope = this;
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].observed = data.observed;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'observed': observed
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/observed', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set observed')
      );
  }
  setFrequency(phenotypeID: number, frequency: number) {
    let scope = this;
    let finishSetObserved = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].frequency = data.frequency;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'frequency': frequency
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/frequency', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetObserved(data),
        err => console.log(err),
        () => console.log('Finish set frequency')
      );
  }
  setOnset(phenotypeID: number, onset: string) {
    let scope = this;
    let finishSetOnset = function(data: any) {
      for (let i = 0; i < scope.annotation.phenotypes.length; i++) {
        if (scope.annotation.phenotypes[i].phenotypeID === data.phenotypeID) {
          scope.annotation.phenotypes[i].onset = data.onset;
        }
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
      'onset': onset
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/onset', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishSetOnset(data),
        err => console.log(err),
        () => console.log('Finish set onset')
      );
  }
  removePhenotype(phenotypeID: number) {
    let scope = this;
    let finishRemovePhenotype = function(data: any) {
      scope.gotoAnnotation(localStorage.getItem('uaAnnotation'), document.documentElement.scrollTop || document.body.scrollTop);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'phenotypeID': phenotypeID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/phenotype/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemovePhenotype(data),
        err => console.log(err),
        () => console.log('Finish remove phenotype')
      );
  }
  removeRef(refID: number) {
    let scope = this;
    let finishRemoveRef = function(data: any) {
      scope.gotoAnnotation(localStorage.getItem('uaAnnotation'), document.documentElement.scrollTop || document.body.scrollTop);
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.annotation.annotationID,
      'refID': refID,
    });
    this._http.post(globals.backendURL + '/restricted/annotation/edit/ref/remove', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishRemoveRef(data),
        err => console.log(err),
        () => console.log('Finish remove ref')
      );
  }
}
