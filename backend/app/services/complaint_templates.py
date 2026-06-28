"""
Template-based complaint/letter generator. Deliberately NOT AI-generated —
official complaint letters need consistent, predictable structure, so we use
plain string templates with field substitution. This also means generation
works even if the AI provider is down.
"""
from datetime import datetime

TEMPLATES_EN: dict[str, str] = {
    "police": """To,
The Officer-in-Charge,
{location} Police Office

Date: {incident_date}

Subject: Complaint regarding {respondent_name_or_incident}

Sir/Madam,

I, {full_name}, residing at {address}, contact number {contact_number}, would like to bring to your
attention the following incident that occurred on {incident_date} at {incident_location}:

{incident_description}

{additional_details}

I request you to kindly register this complaint and take necessary legal action as per prevailing law.

Yours sincerely,
{full_name}
{contact_number}""",

    "cyber_bureau": """To,
The Chief,
Cyber Bureau, Nepal Police
Kathmandu

Date: {incident_date}

Subject: Complaint regarding online/cyber incident

Sir/Madam,

I, {full_name}, residing at {address}, contact number {contact_number}, wish to report the following
cyber-related incident that occurred on {incident_date}:

{incident_description}

{additional_details}

I request the Cyber Bureau to investigate this matter and take appropriate action under the
Electronic Transaction Act and other applicable laws.

Yours sincerely,
{full_name}
{contact_number}""",

    "municipality": """To,
The Ward Office / Municipality,
{incident_location}

Date: {incident_date}

Subject: Complaint regarding {respondent_name_or_incident}

Respected Sir/Madam,

I, {full_name}, a resident of {address}, contact number {contact_number}, would like to report the
following matter for your kind attention and necessary action:

{incident_description}

{additional_details}

I kindly request you to look into this matter and take appropriate action at the earliest.

Yours sincerely,
{full_name}
{contact_number}""",

    "consumer": """To,
The Department of Commerce, Supplies and Consumer Protection
(Consumer Complaint)

Date: {incident_date}

Subject: Consumer complaint against {respondent_name_or_incident}

Sir/Madam,

I, {full_name}, residing at {address}, contact number {contact_number}, would like to file a complaint
regarding the following consumer issue that occurred on {incident_date} at {incident_location}:

{incident_description}

{additional_details}

As per the Consumer Protection Act, I request appropriate investigation and remedy.

Yours sincerely,
{full_name}
{contact_number}""",

    "office_grievance": """To,
{respondent_name_or_incident}

Date: {incident_date}

Subject: Grievance letter

Dear Sir/Madam,

I, {full_name}, would like to formally raise the following grievance regarding an incident that
occurred on {incident_date} at {incident_location}:

{incident_description}

{additional_details}

I request that this matter be reviewed and addressed at the earliest opportunity. I am available
at {contact_number} for any clarification.

Yours sincerely,
{full_name}
{contact_number}""",
}

TEMPLATES_NE: dict[str, str] = {
    "police": """श्रीमान प्रहरी निरीक्षक ज्यू,
{location} प्रहरी कार्यालय

मिति: {incident_date}

विषय: {respondent_name_or_incident} सम्बन्धी उजुरी

महोदय,

म {full_name}, ठेगाना {address}, सम्पर्क नम्बर {contact_number}, निम्न घटनाको सम्बन्धमा तपाईंको
ध्यानाकर्षण गराउन चाहन्छु, जो मिति {incident_date} मा {incident_location} मा भएको थियो:

{incident_description}

{additional_details}

प्रचलित कानून बमोजिम यो उजुरी दर्ता गरी आवश्यक कानूनी कारबाही गरिदिनुहुन अनुरोध छ।

भवदीय,
{full_name}
{contact_number}""",

    "cyber_bureau": """श्रीमान प्रमुख ज्यू,
साइबर ब्यूरो, नेपाल प्रहरी
काठमाडौं

मिति: {incident_date}

विषय: साइबर/अनलाइन घटना सम्बन्धी उजुरी

महोदय,

म {full_name}, ठेगाना {address}, सम्पर्क नम्बर {contact_number}, मिति {incident_date} मा भएको निम्न
साइबर सम्बन्धी घटना उजुर गर्न चाहन्छु:

{incident_description}

{additional_details}

विद्युतीय कारोबार ऐन तथा अन्य प्रचलित कानून बमोजिम यस विषयमा अनुसन्धान गरी कारबाही गरिदिनुहुन अनुरोध छ।

भवदीय,
{full_name}
{contact_number}""",

    "municipality": """श्री वडा कार्यालय / नगरपालिका,
{incident_location}

मिति: {incident_date}

विषय: {respondent_name_or_incident} सम्बन्धी उजुरी

आदरणीय महोदय,

म {full_name}, स्थायी बासिन्दा {address}, सम्पर्क नम्बर {contact_number}, निम्न विषयमा तपाईंको ध्यानाकर्षण
गराउन चाहन्छु:

{incident_description}

{additional_details}

यस विषयमा हेरविचार गरी सकेसम्म चाँडो उपयुक्त कारबाही गरिदिनुहुन अनुरोध छ।

भवदीय,
{full_name}
{contact_number}""",

    "consumer": """वाणिज्य, आपूर्ति तथा उपभोक्ता हित संरक्षण विभाग
(उपभोक्ता उजुरी)

मिति: {incident_date}

विषय: {respondent_name_or_incident} विरुद्ध उपभोक्ता उजुरी

महोदय,

म {full_name}, ठेगाना {address}, सम्पर्क नम्बर {contact_number}, मिति {incident_date} मा {incident_location}
मा भएको निम्न उपभोक्ता सम्बन्धी समस्याको उजुरी दर्ता गर्न चाहन्छु:

{incident_description}

{additional_details}

उपभोक्ता संरक्षण ऐन बमोजिम उपयुक्त अनुसन्धान र समाधान गरिदिनुहुन अनुरोध छ।

भवदीय,
{full_name}
{contact_number}""",

    "office_grievance": """श्री {respondent_name_or_incident}

मिति: {incident_date}

विषय: गुनासो पत्र

महोदय,

म {full_name}, मिति {incident_date} मा {incident_location} मा भएको निम्न घटना सम्बन्धमा औपचारिक रूपमा
गुनासो राख्न चाहन्छु:

{incident_description}

{additional_details}

यो विषय सकेसम्म चाँडो समिक्षा गरी सम्बोधन गरिदिनुहुन अनुरोध छ। थप जानकारीको लागि मलाई {contact_number} मा
सम्पर्क गर्न सकिन्छ।

भवदीय,
{full_name}
{contact_number}""",
}


def generate_complaint_text(
    complaint_type: str,
    language: str,
    full_name: str,
    address: str,
    contact_number: str,
    incident_date: str,
    incident_location: str,
    incident_description: str,
    respondent_name: str | None = None,
    additional_details: str | None = None,
) -> str:
    templates = TEMPLATES_NE if language == "ne" else TEMPLATES_EN
    template = templates.get(complaint_type)
    if not template:
        raise ValueError(f"Unknown complaint type: {complaint_type}")

    respondent_display = respondent_name or ("सम्बन्धित विषय" if language == "ne" else "the matter described below")
    extra = additional_details or ""

    return template.format(
        full_name=full_name,
        address=address,
        contact_number=contact_number,
        incident_date=incident_date,
        incident_location=incident_location,
        location=incident_location,
        incident_description=incident_description,
        respondent_name_or_incident=respondent_display,
        additional_details=extra,
    ).strip()
