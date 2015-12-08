'use strict';

/**
 * @ngdoc directive
 * @name osimiswebviewerApp.directive:wvOverlay
 * @description
 * # wvOverlay
 */
angular.module('osimiswebviewerApp')
// http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/DICOM.html
// http://dicom.nema.org/dicom/2011/11_06pu.pdf
/*
_.invert(_.mapValues(tags, function(tag) {
  return tag.Name;
}));
*/
// @todo move to orthanc service
.constant('orthancTags', {
  "SpecificCharacterSet": "0008,0005",
  "ImageType": "0008,0008",
  "SOPClassUID": "0008,0016",
  "SOPInstanceUID": "0008,0018",
  "StudyDate": "0008,0020",
  "SeriesDate": "0008,0021",
  "AcquisitionDate": "0008,0022",
  "ContentDate": "0008,0023",
  "StudyTime": "0008,0030",
  "SeriesTime": "0008,0031",
  "AcquisitionTime": "0008,0032",
  "ContentTime": "0008,0033",
  "AccessionNumber": "0008,0050",
  "Modality": "0008,0060",
  "Manufacturer": "0008,0070",
  "InstitutionName": "0008,0080",
  "ReferringPhysicianName": "0008,0090",
  "StationName": "0008,1010",
  "StudyDescription": "0008,1030",
  "SeriesDescription": "0008,103e",
  "OperatorsName": "0008,1070",
  "ManufacturerModelName": "0008,1090",
  "ReferencedStudySequence": "0008,1110",
  "ReferencedPerformedProcedureStepSequence": "0008,1111",
  "ReferencedPatientSequence": "0008,1120",
  "ReferencedImageSequence": "0008,1140",
  "PatientName": "0010,0010",
  "PatientID": "0010,0020",
  "PatientAge": "0010,1010",
  "PatientWeight": "0010,1030",
  "ScanningSequence": "0018,0020",
  "SequenceVariant": "0018,0021",
  "ScanOptions": "0018,0022",
  "MRAcquisitionType": "0018,0023",
  "SequenceName": "0018,0024",
  "AngioFlag": "0018,0025",
  "SliceThickness": "0018,0050",
  "RepetitionTime": "0018,0080",
  "EchoTime": "0018,0081",
  "NumberOfAverages": "0018,0083",
  "ImagingFrequency": "0018,0084",
  "ImagedNucleus": "0018,0085",
  "EchoNumbers": "0018,0086",
  "MagneticFieldStrength": "0018,0087",
  "SpacingBetweenSlices": "0018,0088",
  "NumberOfPhaseEncodingSteps": "0018,0089",
  "EchoTrainLength": "0018,0091",
  "PercentSampling": "0018,0093",
  "PercentPhaseFieldOfView": "0018,0094",
  "PixelBandwidth": "0018,0095",
  "DeviceSerialNumber": "0018,1000",
  "SoftwareVersions": "0018,1020",
  "ProtocolName": "0018,1030",
  "TransmitCoilName": "0018,1251",
  "AcquisitionMatrix": "0018,1310",
  "InPlanePhaseEncodingDirection": "0018,1312",
  "FlipAngle": "0018,1314",
  "VariableFlipAngleFlag": "0018,1315",
  "SAR": "0018,1316",
  "dBdt": "0018,1318",
  "PatientPosition": "0018,5100",
  "StudyInstanceUID": "0020,000d",
  "SeriesInstanceUID": "0020,000e",
  "StudyID": "0020,0010",
  "SeriesNumber": "0020,0011",
  "AcquisitionNumber": "0020,0012",
  "InstanceNumber": "0020,0013",
  "ImagePositionPatient": "0020,0032",
  "ImageOrientationPatient": "0020,0037",
  "FrameOfReferenceUID": "0020,0052",
  "SliceLocation": "0020,1041",
  "ImageComments": "0020,4000",
  "SamplesPerPixel": "0028,0002",
  "PhotometricInterpretation": "0028,0004",
  "Rows": "0028,0010",
  "Columns": "0028,0011",
  "PixelSpacing": "0028,0030",
  "BitsAllocated": "0028,0100",
  "BitsStored": "0028,0101",
  "HighBit": "0028,0102",
  "PixelRepresentation": "0028,0103",
  "SmallestImagePixelValue": "0028,0106",
  "LargestImagePixelValue": "0028,0107",
  "WindowCenter": "0028,1050",
  "WindowWidth": "0028,1051",
  "WindowCenterWidthExplanation": "0028,1055",
  "LossyImageCompression": "0028,2110",
  "LossyImageCompressionRatio": "0028,2112",
  "RETIRED_StudyStatusID": "0032,000a",
  "RETIRED_ScheduledStudyStartDate": "0032,1000",
  "RETIRED_ScheduledStudyStartTime": "0032,1001",
  "RETIRED_ScheduledStudyLocationAETitle": "0032,1021",
  "RequestingPhysician": "0032,1032",
  "RequestedProcedureDescription": "0032,1060",
  "RETIRED_StudyComments": "0032,4000",
  "PerformedProcedureStepStartDate": "0040,0244",
  "PerformedProcedureStepStartTime": "0040,0245",
  "PerformedProcedureStepDescription": "0040,0254",
  "RequestAttributesSequence": "0040,0275",
  "PixelData": "7fe0,0010",
})
.directive('wvOverlay', ['orthanc', 'orthancTags', function(orthanc, orthancTags) {
  return {
    scope: {
      wvInstanceId: '='
    },
    template: '<div>{{PatientName}} - {{StudyDescription}}<br/>Age: {{PatientAge}}<br/> Weight: {{PatientWeight}}<br/>{{InstanceNumber}}</div>',
    restrict: 'E',
    link: function postLink(scope, element, attrs) {
      _loadTags(scope.wvInstanceId, undefined);
      scope.$watch('wvInstanceId', _loadTags);

      var tagsCopiedToScope = [
        'InstanceNumber',
        'PatientName',
        'PatientID',
        'PatientAge',
        'PatientWeight',
        'StudyDescription'
      ];

      function _loadTags(wvInstanceId, old) {
        if (wvInstanceId == old || wvInstanceId === null || wvInstanceId == undefined)
          return;

        orthanc
        .instance.getTags({id: wvInstanceId})
        .$promise
        .then(function(tags) {
          scope.ID = wvInstanceId;
          tagsCopiedToScope.forEach(function(tagName) {
            var tagId = orthancTags[tagName];
            if (tags.hasOwnProperty(tagId)) {
              scope[tagName] = tags[tagId].Value;
            }
          });
        });
      }
    }
  };
}]);
