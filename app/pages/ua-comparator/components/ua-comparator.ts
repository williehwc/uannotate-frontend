import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES} from '@angular/router';
import {DROPDOWN_DIRECTIVES, AlertComponent, MODAL_DIRECTVES, BS_VIEW_PROVIDERS} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';
declare var jQuery: any;

@Component({
	moduleId: module.id,
	selector: 'ua-comparator',
	templateUrl: 'ua-comparator.html',
  directives: [[ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES, AlertComponent, MODAL_DIRECTVES]],
  viewProviders: [BS_VIEW_PROVIDERS]
})

export class ComparatorComponent {
  alerts: Array<Object>;
  comparison: any = null;
  systemNames: Array<Object> = [];
  studentLevel: boolean = false;
  profLevel: boolean = false;
  calculatedScore: number = 0;
  calculatedScorePercent: number = 0;
  detailedPhenotype: any = null;
  hpoOfSystemComment: string = null;
  nameOfSystemComment: string = null;
  currentSystemComment: string = null;
  constructor( private _router: Router, private _http: Http) {
    let scope = this;
    if (localStorage.getItem('uaAnnotation') === null) {
      this.alerts = [];
      this.alerts.push({
        type: 'danger',
        msg: 'You don\'t have any annotations open.',
        closable: true
      });
      return;
    }
    this.gotoComparison(localStorage.getItem('uaAnnotation'), localStorage.getItem('uaCompareTo'));
    let gotLevel = function (data: any) {
      if (data.level === 0) {
        scope.studentLevel = true;
        scope.profLevel = false;
      } else {
        scope.studentLevel = false;
        scope.profLevel = true;
      }
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken')
    });
    this._http.post(globals.backendURL + '/restricted/user', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotLevel(data),
        err => console.log(err),
        () => console.log('Got level')
      );
  }
  calculateScore() {
    let totalNumPhenotypesInclDuplicates = 0;
    this.calculatedScore = 0;
    for (let s = 0; s < this.comparison.systems.length; s++) {
      totalNumPhenotypesInclDuplicates += this.comparison.systems[s].phenotypes.length +
        this.comparison.systems[s].compareToPhenotypes.length;
    }
    for (let s = 0; s < this.comparison.systems.length; s++) {
      let numPhenotypesInclDuplicates = this.comparison.systems[s].phenotypes.length +
        this.comparison.systems[s].compareToPhenotypes.length;
      this.calculatedScore += this.comparison.systems[s].systemScore * numPhenotypesInclDuplicates /
        totalNumPhenotypesInclDuplicates;
    }
    this.calculatedScore = Math.ceil(this.calculatedScore * 100) / 100;
    this.calculatedScorePercent = Math.round(this.calculatedScore * 100);
  }
  gotoComparison(annotationID: number, compareToAnnotationID: number) {
    let scope = this;
    this.alerts = [];
    let loadedName = function(data: any) {
      for (let x = 0; x < data.rows.length; x++) {
        let datum = data.rows[x];
        for (let s = 0; s < scope.comparison.systems.length; s++) {
          if (scope.comparison.systems[s].systemHPO === datum.id) {
            scope.comparison.systems[s].systemName = datum.name;
          }
          for (let i = 0; i < scope.comparison.systems[s].phenotypes.length; i++) {
            if (scope.comparison.systems[s].phenotypes[i].hpo === datum.id) {
              scope.comparison.systems[s].phenotypes[i].phenotypeName = datum.name;
              let definition = datum.def;
              if (datum.synonym) {
      			  	definition += ' (Also known as ';
        				for (let i = 0; i < datum.synonym.length; i++) {
        				  if (i !== 0 && i !== datum.synonym.length - 1)
        					definition += ', ';
        				  if (i !== 0 && i === datum.synonym.length - 1)
        				  	definition += ' and ';
        				  definition += '"' + datum.synonym[i] + '"';
        				}
                definition += ')';
      			  }
      			  if (datum.comment) {
          		  definition += ' [' + datum.comment + ']';
        		  }
      			  scope.comparison.systems[s].phenotypes[i].phenotypeDefinition = definition;
            }
          }
          for (let i = 0; i < scope.comparison.systems[s].compareToPhenotypes.length; i++) {
            if (scope.comparison.systems[s].compareToPhenotypes[i].hpo === datum.id) {
              scope.comparison.systems[s].compareToPhenotypes[i].phenotypeName = datum.name;
              let definition = datum.def;
              if (datum.synonym) {
      			  	definition += ' (Also known as ';
        				for (let i = 0; i < datum.synonym.length; i++) {
        				  if (i !== 0 && i !== datum.synonym.length - 1)
        					definition += ', ';
        				  if (i !== 0 && i === datum.synonym.length - 1)
        				  	definition += ' and ';
        				  definition += '"' + datum.synonym[i] + '"';
        				}
                definition += ')';
      			  }
      			  if (datum.comment) {
          		  definition += ' [' + datum.comment + ']';
        		  }
              scope.comparison.systems[s].compareToPhenotypes[i].phenotypeDefinition = definition;
            }
          }
        }
      }
      scope.comparison.systems.sort(function (a: any, b: any) {
        if (b.systemName > a.systemName) {
          return -1;
        } else {
          return 1;
        }
      });
      for (let s = 0; s < scope.comparison.systems.length; s++) {
        scope.comparison.systems[s].phenotypes.sort(function(a: any, b: any) {
          return (a.phenotypeName < b.phenotypeName) ? -1 : 1;
        });
        scope.comparison.systems[s].compareToPhenotypes.sort(function(a: any, b: any) {
          return (a.phenotypeName < b.phenotypeName) ? -1 : 1;
        });
      }
      scope.calculateScore();
    };
    let initializeComparison = function (data:any) {
      scope.comparison = data;
      localStorage.setItem('uaAnnotation', '' + data.annotationID);
      localStorage.setItem('uaCompareTo', '' + data.compareToAnnotationID);
      if (data.systems.length === 0)
        return scope.gotoComparison(localStorage.getItem('uaAnnotation'), localStorage.getItem('uaCompareTo'));
      let phenotypeNames: Array<string> = [];
      for (let s = 0; s < data.systems.length; s++) {
        for (let i = 0; i < data.systems[s].phenotypes.length; i++) {
          if (phenotypeNames.indexOf(data.systems[s].phenotypes[i].hpo) !== -1)
            continue;
          phenotypeNames.push(data.systems[s].phenotypes[i].hpo);
        }
        for (let i = 0; i < data.systems[s].compareToPhenotypes.length; i++) {
          if (phenotypeNames.indexOf(data.systems[s].compareToPhenotypes[i].hpo) !== -1)
            continue;
          phenotypeNames.push(data.systems[s].compareToPhenotypes[i].hpo);
        }
        phenotypeNames.push(data.systems[s].systemHPO);
      }
      let body = JSON.stringify({
        'phenotypeNames': phenotypeNames
      });
      scope._http.post(globals.backendURL + '/definitions', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => loadedName(data),
          err => console.log(err),
          () => console.log('Got names')
        );
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': annotationID,
      'compareToAnnotationID': compareToAnnotationID
    });
    this._http.post(globals.backendURL + '/restricted/annotation/compare', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => initializeComparison(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Comparator is not available for this annotation',
          closable: true
        }),
        () => console.log('Got full comparison')
      );
  }
  goToAnnotator(annotationID: number) {
    this._router.navigate(['/dashboard', '/in-progress', annotationID]);
  }
  gotoPhenository(diseaseDB: string, diseaseName: string) {
    localStorage.setItem('uaPhenositoryDisease', diseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', diseaseDB);
    this._router.navigate(['/dashboard', '/phenository']);
  }
  lookUpDisease(diseaseDB: string, diseaseName: string) {
    if (diseaseDB === 'omim') {
      window.open(globals.omimURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    } else if (diseaseDB === 'ordo') {
      window.open(globals.ordoURL + diseaseName.substr(0, diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    }
  }
  gotoMyClasses() {
    this._router.navigate(['/dashboard', '/exercise', this.comparison.exerciseID]);
  }
  setSystemScoreEvent(event: any) {
    let scope = this;
    if (this.comparison.standard) {
      this.alerts = [];
      this.alerts.push({
        type: 'warning',
        msg: 'You\'ve changed one or more system scores. ' +
        'Please click on the calculated score to confirm that it is correct, then click Save.',
        closable: true
      });
      this.comparison.score = this.calculatedScore;
    }
    if (this.comparison.standard && this.comparison.released) {
      this.alerts = [];
      this.alerts.push({
        type: 'warning',
        msg: 'You\'ve changed one or more system scores. ' +
        'Please click on the calculated score to confirm that it is correct, then click Update.',
        closable: true
      });
    }
    for (let i = 0; i < scope.comparison.systems.length; i++) {
      if (scope.comparison.systems[i].systemHPO === event.target.name) {
        if (scope.comparison.systems[i].systemScore !== event.target.valueAsNumber / 100)
          this.comparison.standard = false;
        scope.comparison.systems[i].systemScore = event.target.valueAsNumber / 100;
        scope.comparison.systems[i].systemScoreSet = true;
      }
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.comparison.annotationID,
      'compareToAnnotationID': this.comparison.compareToAnnotationID,
      'hpo': event.target.name,
      'score': event.target.valueAsNumber / 100,
      'removeCompareToAnnotation': true
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/score/system', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => this.calculateScore(),
        err => console.log(err),
        () => console.log('Set system score')
      );
  }
  setSystemScore(hpo: string, score: number) {
    let scope = this;
    for (let i = 0; i < scope.comparison.systems.length; i++) {
      if (scope.comparison.systems[i].systemHPO === hpo) {
        if (scope.comparison.systems[i].systemScore !== score)
          this.comparison.standard = false;
        scope.comparison.systems[i].systemScore = score;
        scope.comparison.systems[i].systemScoreSet = true;
      }
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.comparison.annotationID,
      'compareToAnnotationID': this.comparison.compareToAnnotationID,
      'hpo': hpo,
      'score': score,
      'removeCompareToAnnotation': false
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/score/system', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => this.calculateScore(),
        err => console.log(err),
        () => console.log('Set system score')
      );
  }
  saveScore() {
    this.alerts = [];
    this.alerts.push({
      type: 'info',
      msg: 'Saving score…',
      closable: true
    });
    let body: string;
    if (jQuery('#no-grade').is(':checked')) {
      body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.comparison.annotationID,
        'compareToAnnotationID': null,
        'score': null,
        'memo': jQuery('#memo').val()
      });
      jQuery('#score').val('');
    }
    if (jQuery('#auto-grade').is(':checked')) {
      body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.comparison.annotationID,
        'compareToAnnotationID': this.comparison.compareToAnnotationID,
        'score': this.calculatedScore,
        'memo': jQuery('#memo').val()
      });
      jQuery('#score').val('');
      this.comparison.standard = true;
      for (let i = 0; i < this.comparison.systems.length; i++) {
        if (!this.comparison.systems[i].systemScoreSet)
          this.setSystemScore(this.comparison.systems[i].systemHPO, this.comparison.systems[i].systemScore);
      }
    }
    if (jQuery('#manual-grade').is(':checked')) {
      body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': this.comparison.annotationID,
        'compareToAnnotationID': null,
        'score': Math.round(jQuery('#score').val()) / 100,
        'memo': jQuery('#memo').val()
      });
      jQuery('#score').val(Math.round(jQuery('#score').val()));
    }
    this._http.post(globals.backendURL + '/restricted/annotation/prof/score/save', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => this.alerts.splice(0, 1, {
          type: 'success',
          msg: 'Score saved',
          closable: true
        }),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot save score',
          closable: true
        }),
        () => console.log('Saved score')
      );
  }
  saveAndReleaseScore() {
    this.saveScore();
    this.comparison.released = true;
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.comparison.annotationID,
      release: true
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/score/release', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot release score',
          closable: true
        }),
        () => console.log('Released score')
      );
  }
  unreleaseScore() {
    this.alerts = [];
    this.comparison.released = false;
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.comparison.annotationID,
      release: false
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/score/release', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => this.alerts.push({
          type: 'danger',
          msg: 'Cannot unrelease score',
          closable: true
        }),
        () => console.log('Unreleased score')
      );
  }
  openDetails(phenotype: any) {
    this.detailedPhenotype = phenotype;
  }
  closeAnnotation() {
    localStorage.removeItem('uaAnnotation');
    if (this.profLevel) {
      this._router.navigate(['/dashboard', '/class-prof', this.comparison.classID]);
    } else {
      this._router.navigate(['/dashboard', '/class-student', this.comparison.classID]);
    }
  }
  editSystemComment(system: any) {
    this.hpoOfSystemComment = system.systemHPO;
    this.nameOfSystemComment = system.systemName;
    this.currentSystemComment = system.systemComment;
  }
  saveSystemComment() {
    for (let i = 0; i < this.comparison.systems.length; i++) {
      if (this.comparison.systems[i].systemHPO === this.hpoOfSystemComment) {
        if (this.currentSystemComment.length > 0) {
          this.comparison.systems[i].systemComment = this.currentSystemComment;
        } else {
          this.comparison.systems[i].systemComment = null;
        }
      }
    }
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'annotationID': this.comparison.annotationID,
      'compareToAnnotationID': this.comparison.compareToAnnotationID,
      'hpo': this.hpoOfSystemComment,
      'comment': this.currentSystemComment
    });
    this._http.post(globals.backendURL + '/restricted/annotation/prof/comment/system', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => console.log(data),
        err => console.log(err),
        () => console.log('Set system comment')
      );
  }
  round(x: number) {
    return Math.round(x);
  }
  roundToPercent(dec: number) {
    if (dec === -1)
      return -1;
    return Math.round(dec * 100);
  }
  roundToPercentDec(dec: number) {
    if ((dec * 100).toFixed(1).slice(-1) === '0') {
      return this.roundToPercent(dec).toString();
    } else {
      return (dec * 100).toFixed(1);
    }
  }
  onsetAbbreviation(hpo: string, hpoTo: string) {
    if (hpoTo === '-1') {
      switch (hpo) {
        case 'HP:0030674':
          return 'ANT';
        case 'HP:0003577':
          return 'CON';
        case 'HP:0003623':
          return 'NEO';
        case 'HP:0003593':
          return 'INF';
        case 'HP:0011463':
          return 'CHI';
        case 'HP:0003621':
          return 'JUV';
        case 'HP:0003581':
          return 'ADU';
        case '-1':
          return '–––';
        default:
          return null;
      }
    } else {
      let abbreviation : string = this.onsetAbbreviation(hpo, '-1');
      let abbreviationTo : string = this.onsetAbbreviation(hpoTo, '-1');
      return abbreviation.charAt(0) + '-' + abbreviationTo.charAt(0);
    }
  }
  onsetDescription(hpo: string, hpoTo: string) {
    if (hpoTo === '-1') {
      switch (hpo) {
        case 'HP:0030674':
          return 'Antenatal (before birth)';
        case 'HP:0003577':
          return 'Congenital (at birth)';
        case 'HP:0003623':
          return 'Neonatal (0 to 28 days)';
        case 'HP:0003593':
          return 'Infantile (28 days to 1 year)';
        case 'HP:0011463':
          return 'Childhood (1 to 5 years)';
        case 'HP:0003621':
          return 'Juvenile (5 to 15 years)';
        case 'HP:0003581':
          return 'Adult (16 years or later)';
        case '-1':
          return 'Not sure';
        default:
          return null;
      }
    } else {
      let description : string = this.onsetDescription(hpo, '-1');
      let descriptionTo : string = this.onsetDescription(hpoTo, '-1');
      return description + ' to ' + descriptionTo.toLowerCase();
    }
  }
  frequencyDescription(frequency: number, frequencyTo: number) {
    if (frequencyTo === -1) {
      switch (frequency) {
        case -1:
          return 'Not sure';
        case 0:
          return 'Variable (prob. 30% to 70%)';
        case 0.01:
          return 'Very rare (1%)';
        case 0.05:
          return 'Rare (5%)';
        case 0.075:
          return 'Occasional (7.5%)';
        case 0.33:
          return 'Frequent (33%)';
        case 0.5:
          return 'Typical (50%)';
        case 0.75:
          return 'Common (75%)';
        case 0.9:
          return 'Hallmark (90%)';
        case 1:
          return 'Obligate (100%)';
        default:
          return this.roundToPercentDec(frequency) + '%';
      }
    } else {
      let description : string = this.frequencyDescription(frequency, -1);
      let descriptionTo : string = this.frequencyDescription(frequencyTo, -1);
      return description + ' to ' + descriptionTo.toLowerCase();
    }
  }
}
