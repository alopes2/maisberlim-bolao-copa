resource "aws_acm_certificate" "cloudfront" {
  provider = aws.useast1

  domain_name = local.domain_name

  subject_alternative_names = [
    "www.${local.domain_name}"
  ]

  validation_method = "DNS"
}

resource "aws_acm_certificate_validation" "cloudfront" {
  provider = aws.useast1

  certificate_arn = aws_acm_certificate.cloudfront.arn

  validation_record_fqdns = [
    for dvo in aws_acm_certificate.cloudfront.domain_validation_options :
    trimsuffix(dvo.resource_record_name, ".")
  ]
}

resource "aws_acm_certificate" "api" {
  domain_name = "api.${local.domain_name}"

  validation_method = "DNS"
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn = aws_acm_certificate.api.arn

  validation_record_fqdns = [
    for dvo in aws_acm_certificate.api.domain_validation_options :
    trimsuffix(dvo.resource_record_name, ".")
  ]
}

