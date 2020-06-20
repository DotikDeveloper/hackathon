// eslint-disable-next-line no-unused-vars
const forEach = require("lodash").forEach;

let fieldComponents = {};

import fieldCheckbox from '../fields/core/fieldCheckbox';
fieldComponents.fieldCheckbox = fieldCheckbox;
import fieldChecklist from '../fields/core/fieldChecklist';
fieldComponents.fieldChecklist = fieldChecklist;
import fieldInput from '../fields/core/fieldInput';
fieldComponents.fieldInput = fieldInput;
import fieldLabel from '../fields/core/fieldLabel';
fieldComponents.fieldLabel = fieldLabel;
import fieldRadios from '../fields/core/fieldRadios';
fieldComponents.fieldRadios = fieldRadios;
import fieldSelect from '../fields/core/fieldSelect';
fieldComponents.fieldSelect = fieldSelect;
import fieldSubmit from '../fields/core/fieldSubmit';
fieldComponents.fieldSubmit = fieldSubmit;
import fieldTextArea from '../fields/core/fieldTextArea';
fieldComponents.fieldTextArea = fieldTextArea;
import fieldUpload from '../fields/core/fieldUpload';
fieldComponents.fieldUpload = fieldUpload;
import fieldDates from "../themes/bootstrap/fields/fieldDates";
fieldComponents.fieldDates = fieldDates;
import fieldDropdown from "../themes/bootstrap/fields/fieldDropdown";
fieldComponents.fieldDropdown = fieldDropdown;


import fieldCleave from '../fields/optional/fieldCleave';
fieldComponents.fieldCleave = fieldCleave;
import fieldDateTimePicker from '../fields/optional/fieldDateTimePicker';
fieldComponents.fieldDateTimePicker = fieldDateTimePicker;
import fieldGoogleAddress from '../fields/optional/fieldGoogleAddress';
fieldComponents.fieldGoogleAddress = fieldGoogleAddress;
import fieldImage from '../fields/optional/fieldImage';
fieldComponents.fieldImage = fieldImage;
import fieldMasked from '../fields/optional/fieldMasked';
fieldComponents.fieldMasked = fieldMasked;
import fieldNoUiSlider from '../fields/optional/fieldNoUiSlider';
fieldComponents.fieldNoUiSlider = fieldNoUiSlider;
import fieldPikaday from '../fields/optional/fieldPikaday';
fieldComponents.fieldPikaday = fieldPikaday;

import fieldRangeSlider from '../fields/optional/fieldRangeSlider';
fieldComponents.fieldRangeSlider = fieldRangeSlider;

import fieldSelectEx from '../fields/optional/fieldSelectEx';
fieldComponents.fieldSelectEx = fieldSelectEx;

import fieldSpectrum from '../fields/optional/fieldSpectrum';
fieldComponents.fieldSpectrum = fieldSpectrum;

import fieldStaticMap from '../fields/optional/fieldStaticMap';
fieldComponents.fieldStaticMap = fieldStaticMap;

import fieldSwitch from '../fields/optional/fieldSwitch';
fieldComponents.fieldSwitch = fieldSwitch;
import fieldVueMultiSelect from '../fields/optional/fieldVueMultiSelect';
fieldComponents.fieldVueMultiSelect = fieldVueMultiSelect;

export default fieldComponents;
