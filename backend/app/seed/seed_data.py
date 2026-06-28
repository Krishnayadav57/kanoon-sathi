"""
Seeds the database with:
- Legal categories (8 areas from the spec)
- A starter set of legal knowledge-base articles (NEEDS LEGAL REVIEW before
  production — content here is a reasonable-effort starting point, not a
  substitute for verification by someone with Nepal legal training)
- One sample quiz
- A few office locations (Kathmandu valley, illustrative)
- A few sample (clearly fake/demo) lawyer profiles
- An admin user for local testing

Run with: python -m app.seed.seed_data
"""
from datetime import datetime

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models.extras import LawyerProfile, OfficeLocation, Quiz
from app.models.knowledge_base import LegalArticle, LegalCategory
from app.models.user import User, UserRole

CATEGORIES = [
    dict(slug="constitution", name_en="Constitution of Nepal", name_ne="नेपालको संविधान", icon="landmark",
         description_en="Fundamental rights, duties, and the structure of the state.",
         description_ne="मौलिक हक, कर्तव्य र राज्यको संरचना।"),
    dict(slug="traffic", name_en="Traffic Laws", name_ne="सवारी कानून", icon="car",
         description_en="Rules of the road, licensing, and traffic violations.",
         description_ne="सडक नियम, लाइसेन्स र सवारी उल्लंघन।"),
    dict(slug="cyber", name_en="Cyber Laws", name_ne="साइबर कानून", icon="shield",
         description_en="Online safety, electronic transactions, and cybercrime.",
         description_ne="अनलाइन सुरक्षा, विद्युतीय कारोबार र साइबर अपराध।"),
    dict(slug="consumer", name_en="Consumer Rights", name_ne="उपभोक्ता अधिकार", icon="shopping-cart",
         description_en="Protection for buyers of goods and services.",
         description_ne="वस्तु तथा सेवाका उपभोक्ताको संरक्षण।"),
    dict(slug="labor", name_en="Labor Laws", name_ne="श्रम कानून", icon="briefcase",
         description_en="Worker rights, wages, and workplace conditions.",
         description_ne="श्रमिकका अधिकार, ज्याला र कार्यस्थलको अवस्था।"),
    dict(slug="property", name_en="Property Laws", name_ne="सम्पत्ति कानून", icon="home",
         description_en="Land ownership, tenancy, and property disputes.",
         description_ne="जमिन स्वामित्व, बहाल र सम्पत्ति विवाद।"),
    dict(slug="business", name_en="Business Laws", name_ne="व्यवसाय कानून", icon="building",
         description_en="Company registration, taxation, and compliance.",
         description_ne="कम्पनी दर्ता, कर र अनुपालन।"),
    dict(slug="family", name_en="Family Laws", name_ne="पारिवारिक कानून", icon="users",
         description_en="Marriage, divorce, custody, and inheritance.",
         description_ne="विवाह, सम्बन्ध विच्छेद, संरक्षण र अंशबण्डा।"),
]

ARTICLES = [
    dict(category_slug="traffic", title_en="Riding without a helmet", title_ne="हेलमेट नलगाई सवारी चलाउनु",
         summary_en="Riding a two-wheeler without a helmet is a punishable traffic offense in Nepal.",
         summary_ne="नेपालमा हेलमेट नलगाई दुई पाङ्ग्रे सवारी चलाउनु दण्डनीय ट्राफिक कसुर हो।",
         full_text_en=("Under Nepal's traffic regulations, riders and pillion passengers on motorcycles/scooters "
                        "are required to wear a helmet. Traffic police may issue an on-the-spot fine for violations. "
                        "Repeated violations can affect license standing. If stopped, the rider should cooperate, "
                        "show their license and vehicle documents (bluebook), and may pay the fine at the designated "
                        "channel or contest it through proper process if they believe it was wrongly issued."),
         full_text_ne=("नेपालको ट्राफिक नियमावली अनुसार मोटरसाइकल/स्कुटर चालक र पछाडि बस्ने व्यक्तिले हेलमेट लगाउनु "
                       "अनिवार्य छ। उल्लंघन गरेमा ट्राफिक प्रहरीले तत्काल जरिवाना गर्न सक्छ। पटक पटक उल्लंघन गरेमा "
                       "लाइसेन्समा असर पर्न सक्छ। रोकिएमा चालकले सहयोग गर्नुपर्छ, लाइसेन्स र सवारी कागजात (ब्लुबुक) "
                       "देखाउनुपर्छ।"),
         source_reference="Motor Vehicles and Transport Management Act, 2049 (general traffic safety provisions)"),

    dict(category_slug="traffic", title_en="What to do after a road accident", title_ne="सडक दुर्घटना पछि के गर्ने",
         summary_en="Steps to take immediately after being involved in a traffic accident.",
         summary_ne="ट्राफिक दुर्घटनामा परेपछि तत्काल लिनुपर्ने कदमहरू।",
         full_text_en=("If you are involved in a road accident: ensure safety first and call for medical help if "
                        "anyone is injured. Do not flee the scene. Inform the nearest Traffic Police office as soon "
                        "as possible. Take photos of the scene, vehicles, and any visible damage. Exchange details "
                        "with the other party. A police report is usually required for insurance claims."),
         full_text_ne=("सडक दुर्घटनामा परेमा: पहिले सुरक्षा सुनिश्चित गर्नुहोस् र घाइते भएमा चिकित्सा सहायताको लागि "
                       "फोन गर्नुहोस्। घटनास्थल नछोड्नुहोस्। नजिकैको ट्राफिक प्रहरी कार्यालयलाई सकेसम्म चाँडो जानकारी "
                       "दिनुहोस्। घटनास्थल, सवारी साधन र देखिने क्षतिका फोटो खिच्नुहोस्। बीमा दाबीको लागि सामान्यतया "
                       "प्रहरी प्रतिवेदन आवश्यक पर्छ।"),
         source_reference="General traffic accident protocol, Nepal Police Traffic Directorate"),

    dict(category_slug="cyber", title_en="Online harassment and cyberbullying", title_ne="अनलाइन दुर्व्यवहार र साइबर बुलिङ",
         summary_en="Online harassment, threats, or defamation can be reported to the Cyber Bureau.",
         summary_ne="अनलाइन दुर्व्यवहार, धाक वा बदनामी साइबर ब्यूरोमा उजुरी गर्न सकिन्छ।",
         full_text_en=("The Electronic Transactions Act criminalizes certain forms of online harassment, including "
                        "publishing material that may be considered obscene or damaging to someone's reputation "
                        "through electronic means. Victims should preserve evidence (screenshots, URLs, timestamps) "
                        "without deleting the original content, and can file a complaint with the Cyber Bureau, "
                        "Nepal Police, either in person or through their online complaint channel."),
         full_text_ne=("विद्युतीय कारोबार ऐनले विद्युतीय माध्यमबाट कसैको बदनाम हुने वा अश्लील सामग्री प्रकाशन जस्ता "
                       "केही अनलाइन दुर्व्यवहारलाई अपराध मानेको छ। पीडितले प्रमाण (स्क्रिनशट, URL, मिति-समय) "
                       "सुरक्षित राख्नुपर्छ र मूल सामग्री नमेटाउनुपर्छ, र नेपाल प्रहरीको साइबर ब्यूरोमा प्रत्यक्ष वा "
                       "अनलाइन च्यानलबाट उजुरी दिन सकिन्छ।"),
         source_reference="Electronic Transactions Act, 2063 (Sec. 47 and related provisions)"),

    dict(category_slug="consumer", title_en="Right to refund for defective products", title_ne="त्रुटिपूर्ण वस्तुको लागि फिर्ता पाउने अधिकार",
         summary_en="Consumers have a right to remedy when sold defective or substandard goods.",
         summary_ne="त्रुटिपूर्ण वा गुणस्तरहीन वस्तु बिक्री भएमा उपभोक्ताले उपचार पाउने अधिकार हुन्छ।",
         full_text_en=("Nepal's Consumer Protection Act gives consumers the right to a refund, replacement, or "
                        "repair when goods are found to be defective, expired, or not matching what was advertised. "
                        "Consumers should keep purchase receipts and first raise the issue directly with the seller "
                        "in writing. If unresolved, a complaint can be filed with the Department of Consumer "
                        "Protection or the local Consumer Court."),
         full_text_ne=("नेपालको उपभोक्ता संरक्षण ऐनले त्रुटिपूर्ण, म्याद नाघेको वा विज्ञापन अनुरूप नभएको वस्तुको "
                       "हकमा उपभोक्तालाई फिर्ता, साटो वा मर्मतको अधिकार दिएको छ। उपभोक्ताले खरिद बिल राख्नुपर्छ र "
                       "पहिले विक्रेतालाई लिखित रूपमा जानकारी दिनुपर्छ। समाधान नभएमा उपभोक्ता हित संरक्षण विभाग वा "
                       "उपभोक्ता अदालतमा उजुरी दिन सकिन्छ।"),
         source_reference="Consumer Protection Act, 2075"),

    dict(category_slug="labor", title_en="Unpaid wages or salary delay", title_ne="ज्याला/तलब नदिने वा ढिलाइ गर्ने",
         summary_en="Employees have a legal right to timely payment of agreed wages.",
         summary_ne="कर्मचारीले सहमति भएको ज्याला समयमै पाउने कानूनी अधिकार हुन्छ।",
         full_text_en=("The Labor Act requires employers to pay wages within the agreed period, typically monthly. "
                        "Withholding wages without lawful cause is a violation. Employees should keep their "
                        "employment contract, attendance records, and payslips. The first step is usually a written "
                        "request to the employer; if unresolved, a complaint can be filed with the local Labor "
                        "Office."),
         full_text_ne=("श्रम ऐनले रोजगारदातालाई तोकिएको अवधिभित्र, सामान्यतया मासिक रूपमा, ज्याला भुक्तानी गर्नुपर्ने "
                       "व्यवस्था गरेको छ। बिना कानूनी कारण ज्याला रोक्नु उल्लंघन हो। कर्मचारीले रोजगार सम्झौता, "
                       "उपस्थिति विवरण र तलब पर्ची राख्नुपर्छ। पहिलो चरणमा रोजगारदातालाई लिखित अनुरोध गर्ने, समाधान "
                       "नभएमा स्थानीय श्रम कार्यालयमा उजुरी दिन सकिन्छ।"),
         source_reference="Labor Act, 2074"),

    dict(category_slug="property", title_en="Tenant rights regarding rent agreements", title_ne="घरबहाल सम्झौता सम्बन्धी बहालवालाको अधिकार",
         summary_en="A written rental agreement protects both tenant and landlord.",
         summary_ne="लिखित घरबहाल सम्झौताले बहालवाला र घरबेटी दुवैलाई सुरक्षा दिन्छ।",
         full_text_en=("It is advisable for any rental arrangement to be documented in a written agreement "
                        "specifying rent amount, duration, deposit, and notice period for termination. Landlords "
                        "generally cannot evict a tenant without proper notice as agreed in the contract or under "
                        "local practice. Disputes are often first addressed through the local Ward Office before "
                        "escalating further."),
         full_text_ne=("कुनै पनि घरबहाल व्यवस्थालाई भाडा रकम, अवधि, धरौटी र खाली गर्ने सूचना अवधि स्पष्ट उल्लेख गरी "
                       "लिखित सम्झौतामा राख्नु उचित हुन्छ। सम्झौता वा स्थानीय प्रचलन बमोजिम उचित सूचना नदिई घरबेटीले "
                       "सामान्यतया बहालवालालाई हटाउन सक्दैन। विवादहरू प्रायः पहिले स्थानीय वडा कार्यालयमार्फत "
                       "समाधान गरिन्छ।"),
         source_reference="General tenancy practice; local Ward Office jurisdiction"),

    dict(category_slug="business", title_en="Annual company renewal requirement", title_ne="वार्षिक कम्पनी नवीकरण आवश्यकता",
         summary_en="Registered companies must renew their registration annually to remain in good standing.",
         summary_ne="दर्ता भएका कम्पनीले राम्रो हैसियत कायम राख्न वार्षिक रूपमा नवीकरण गर्नुपर्छ।",
         full_text_en=("Companies registered under the Companies Act must file annual renewal with the Office of "
                        "Company Registrar (OCR) and submit required documents such as financial statements. "
                        "Failure to renew on time can result in penalties and, in prolonged cases, can affect the "
                        "company's legal standing."),
         full_text_ne=("कम्पनी ऐन अन्तर्गत दर्ता भएका कम्पनीले कम्पनी रजिष्ट्रारको कार्यालय (OCR) मा वार्षिक "
                       "नवीकरण गर्नुपर्छ र वित्तीय विवरण जस्ता आवश्यक कागजात पेश गर्नुपर्छ। समयमा नवीकरण नगरेमा "
                       "जरिवाना लाग्न सक्छ र लम्बिएमा कम्पनीको कानूनी हैसियतमा असर पर्न सक्छ।"),
         source_reference="Companies Act, 2063"),

    dict(category_slug="family", title_en="Process for divorce by mutual consent", title_ne="आपसी सहमतिमा सम्बन्ध विच्छेदको प्रक्रिया",
         summary_en="Nepal law allows divorce by mutual consent through the District Court.",
         summary_ne="नेपालको कानूनले जिल्ला अदालतमार्फत आपसी सहमतिमा सम्बन्ध विच्छेद गर्न अनुमति दिन्छ।",
         full_text_en=("Under the National Civil Code, spouses may seek divorce by mutual consent by filing a joint "
                        "application at the District Court along with required documents. The court may also handle "
                        "related matters such as property division and child custody as part of the proceeding. "
                        "Consulting a family-law lawyer is strongly recommended given the documentation involved."),
         full_text_ne=("मुलुकी देवानी संहिता अन्तर्गत, पति-पत्नीले आवश्यक कागजातसहित जिल्ला अदालतमा संयुक्त "
                       "निवेदन दिई आपसी सहमतिमा सम्बन्ध विच्छेद माग गर्न सक्छन्। अदालतले सम्पत्ति बाँडफाँड र बालबालिकाको "
                       "संरक्षण जस्ता विषयहरू पनि सँगसँगै हेर्न सक्छ। कागजात जटिल हुने हुनाले पारिवारिक कानून "
                       "विज्ञसँग सल्लाह लिनु उचित हुन्छ।"),
         source_reference="National Civil Code (Muluki Dewani Samhita), 2074"),

    dict(category_slug="constitution", title_en="Right to information", title_ne="सूचनाको हक",
         summary_en="Every citizen has a constitutional right to access information held by public bodies.",
         summary_ne="प्रत्येक नागरिकलाई सार्वजनिक निकायसँग रहेको सूचना पाउने संवैधानिक अधिकार हुन्छ।",
         full_text_en=("The Constitution of Nepal guarantees the right to information as a fundamental right, "
                        "subject to reasonable restrictions for matters like national security. Citizens can "
                        "request information from public offices under the Right to Information Act, and offices "
                        "are generally required to respond within a specified timeframe."),
         full_text_ne=("नेपालको संविधानले सूचनाको हकलाई मौलिक हकको रूपमा सुनिश्चित गरेको छ, जसमा राष्ट्रिय "
                       "सुरक्षा जस्ता विषयमा उचित बन्देज लाग्न सक्छ। नागरिकले सूचनाको हक सम्बन्धी ऐन अन्तर्गत "
                       "सार्वजनिक निकायबाट सूचना माग्न सक्छन्, र कार्यालयले तोकिएको समयभित्र जवाफ दिनुपर्ने हुन्छ।"),
         source_reference="Constitution of Nepal, Article 27; Right to Information Act, 2064"),
]

SAMPLE_QUIZ = dict(
    category_slug="traffic",
    title_en="Traffic Law Basics",
    title_ne="सवारी कानून आधारभूत",
    questions=[
        {
            "question_en": "Is wearing a helmet mandatory for motorcycle riders in Nepal?",
            "question_ne": "नेपालमा मोटरसाइकल चालकलाई हेलमेट लगाउनु अनिवार्य छ?",
            "options_en": ["Yes", "No", "Only on highways", "Only at night"],
            "options_ne": ["हो", "होइन", "हाइवेमा मात्र", "राति मात्र"],
            "correct_index": 0,
        },
        {
            "question_en": "What should you do first after a road accident with injuries?",
            "question_ne": "घाइते भएको सडक दुर्घटना पछि पहिले के गर्नुपर्छ?",
            "options_en": ["Leave the scene", "Call for medical help", "Argue with the other party", "Post on social media"],
            "options_ne": ["घटनास्थल छोड्ने", "चिकित्सा सहायताको लागि फोन गर्ने", "अर्को पक्षसँग झगडा गर्ने", "सामाजिक सञ्जालमा पोस्ट गर्ने"],
            "correct_index": 1,
        },
        {
            "question_en": "Which document should you show traffic police if stopped?",
            "question_ne": "ट्राफिक प्रहरीले रोकेमा कुन कागजात देखाउनुपर्छ?",
            "options_en": ["License and bluebook", "Citizenship only", "Nothing required", "Passport"],
            "options_ne": ["लाइसेन्स र ब्लुबुक", "नागरिकता मात्र", "केही चाहिँदैन", "राहदानी"],
            "correct_index": 0,
        },
    ],
)

OFFICES = [
    dict(office_type="police", name_en="Ranipokhari Police Office", name_ne="रानीपोखरी प्रहरी कार्यालय",
         address="Ranipokhari, Kathmandu", district="Kathmandu", phone="01-4411432", latitude=27.7095, longitude=85.3144),
    dict(office_type="traffic", name_en="Metropolitan Traffic Police Division, Ramshahapath",
         name_ne="महानगरीय ट्राफिक प्रहरी डिभिजन, रामशाहपथ",
         address="Ramshahapath, Kathmandu", district="Kathmandu", phone="01-4412757", latitude=27.7039, longitude=85.3157),
    dict(office_type="court", name_en="Kathmandu District Court", name_ne="काठमाडौं जिल्ला अदालत",
         address="Ramshahpath, Kathmandu", district="Kathmandu", phone="01-4200304", latitude=27.7050, longitude=85.3145),
    dict(office_type="government", name_en="Department of Consumer Protection", name_ne="उपभोक्ता हित संरक्षण विभाग",
         address="Tripureshwor, Kathmandu", district="Kathmandu", phone="01-4262649", latitude=27.6553, longitude=85.3122),
    dict(office_type="government", name_en="Cyber Bureau, Nepal Police", name_ne="साइबर ब्यूरो, नेपाल प्रहरी",
         address="Maharajgunj, Kathmandu", district="Kathmandu", phone="1130", latitude=27.7368, longitude=85.3372),
]

LAWYERS = [
    dict(full_name="Adv. Samjhana Rai (demo profile)", specialization="cyber_law",
         bio_en="Demo profile for the Lawyer Marketplace prototype. Replace with verified real lawyer data before launch.",
         bio_ne="वकिल बाजार प्रोटोटाइपको लागि डेमो प्रोफाइल। सुरुवात गर्नु अघि प्रमाणित वास्तविक वकिल डाटाले बदलनुहोस्।",
         years_experience=8, consultation_fee_npr=1500, is_verified=True),
    dict(full_name="Adv. Bikash Shrestha (demo profile)", specialization="family_law",
         bio_en="Demo profile for the Lawyer Marketplace prototype. Replace with verified real lawyer data before launch.",
         bio_ne="वकिल बाजार प्रोटोटाइपको लागि डेमो प्रोफाइल। सुरुवात गर्नु अघि प्रमाणित वास्तविक वकिल डाटाले बदलनुहोस्।",
         years_experience=12, consultation_fee_npr=2000, is_verified=True),
    dict(full_name="Adv. Nisha Gurung (demo profile)", specialization="property_law",
         bio_en="Demo profile for the Lawyer Marketplace prototype. Replace with verified real lawyer data before launch.",
         bio_ne="वकिल बाजार प्रोटोटाइपको लागि डेमो प्रोफाइल। सुरुवात गर्नु अघि प्रमाणित वास्तविक वकिल डाटाले बदलनुहोस्।",
         years_experience=6, consultation_fee_npr=1200, is_verified=True),
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(LegalCategory).count() == 0:
            for c in CATEGORIES:
                db.add(LegalCategory(**c))
            print(f"Seeded {len(CATEGORIES)} legal categories.")

        if db.query(LegalArticle).count() == 0:
            for a in ARTICLES:
                db.add(LegalArticle(**a, last_verified_at=datetime.utcnow()))
            print(f"Seeded {len(ARTICLES)} legal articles.")

        if db.query(Quiz).count() == 0:
            db.add(Quiz(**SAMPLE_QUIZ))
            print("Seeded 1 sample quiz.")

        if db.query(OfficeLocation).count() == 0:
            for o in OFFICES:
                db.add(OfficeLocation(**o))
            print(f"Seeded {len(OFFICES)} office locations.")

        if db.query(LawyerProfile).count() == 0:
            for l in LAWYERS:
                db.add(LawyerProfile(**l))
            print(f"Seeded {len(LAWYERS)} demo lawyer profiles.")

        if db.query(User).filter(User.email == "admin@kanoonmitra.np").count() == 0:
            admin = User(
                full_name="Kanoon Mitra Admin",
                email="admin@kanoonmitra.np",
                hashed_password=hash_password("ChangeThisPassword123!"),
                role=UserRole.ADMIN,
                is_email_verified=True,
            )
            db.add(admin)
            print("Seeded admin user: admin@kanoonmitra.np / ChangeThisPassword123! (CHANGE THIS PASSWORD)")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
