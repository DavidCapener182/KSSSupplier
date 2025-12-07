export function generateContractorAgreement(provider: {
  company_name: string;
  address: string;
  company_registration: string;
  contact_email: string;
  contact_phone?: string;
  signed_name?: string;
  signed_date?: string;
}): string {
  const today = provider.signed_date ? new Date(provider.signed_date) : new Date();
  const day = today.getDate();
  const month = today.toLocaleString('en-GB', { month: 'long' });
  const year = today.getFullYear();

  return `SECURITY LABOUR PROVIDER AGREEMENT

DATED: ${day} / ${month} / ${year}

(1) KSS NW UK LTD

(2) ${provider.company_name}

THIS AGREEMENT is made on the ${day} Day of ${month} ${year}

BETWEEN:

(1) KSS NW UK LTD a company registered in England & Wales under number 09239103 of St
Peter House, Sliverwell Street, Bolton BL1 1PP (the "Provider") and

(2) ${provider.company_name} of ${provider.address}, – Company
Registration ${provider.company_registration} (the "Labour Provider")

WHEREAS:

(1) The Provider is engaged in the business of providing security services, has reasonable
skill, knowledge and experience in that field, and requires the services of suitably skilled,
trained, knowledgeable and experienced Labour Providers.

(2) The Labour Provider has reasonable skill, training, knowledge and experience in the field
of security services and wishes to offer his services to the Provider.

(3) In reliance upon that skill, training, knowledge and experience the Provider wishes to
engage the Labour Provider to provide the security services described herein and the
Labour Provider has agreed to accept the engagement subject to the terms and conditions
of this Agreement.

IT IS AGREED as follows:

1. Definitions and Interpretation

In this Agreement, unless the context otherwise requires, the following expressions have the
following meanings:

• "Business Day": means any day (other than Saturday or Sunday) on which ordinary
banks are open for their full range of normal business in England.

• "Confidential Information": means, in relation to either Party, information which is
disclosed to that Party by the other Party pursuant to or in connection with this
Agreement (whether orally or in writing or any other medium, and whether the
information is expressly stated to be confidential or marked as such);

• "Provider's Client": means any company linked directly or indirectly to the Provider.

• "Party": means either party to this Agreement and "Parties" means both of the
parties to this Agreement.

• "Services": means the security services to be provided by the Labour Provider as
set out in Clause 2 and Schedule 1.

• "SIA": means the Security Industry Authority, the regulatory body for the private
security industry in the United Kingdom.

• "Term": means the term of this Agreement for which the Services will be provided as
set out in Schedule 1.

• "Worker": means any person, either self-employed or employed by the Labour
Provider, with suitable skill, knowledge, experience and SIA licencing, who is
nominated and engaged by the Labour Provider to carry out any or all the Services
on the Labour Provider's behalf.

Unless the context otherwise requires, each reference in this Agreement to:

• "writing", and any cognate expression, includes a reference to any communication
effected by electronic or facsimile transmission or similar means.

• a statute or a provision of a statute is a reference to that statute or provision as
amended or re-enacted at the relevant time.

• "This Agreement" is a reference to this Agreement and each of the Schedules as
amended or supplemented at the relevant time.

• a Schedule is a schedule to this Agreement; and

• a Clause or paragraph is a reference to a Clause of this Agreement (other than the
Schedules) or a paragraph of the relevant Schedule.

• a "Party" or the "Parties" refer to the parties to this Agreement.

The headings used in this Agreement are for convenience only and shall have no effect
upon the interpretation of this Agreement. Words imparting the singular number shall include
the plural and vice versa. References to any gender shall include the other gender.

2. Engagement of the Labour Provider, and obligations of the Parties

2.1 The Provider hereby engages the Labour Provider to provide the Services detailed in
Schedule 1, for the Term specified therein, in accordance with the terms and conditions of
this Agreement.

2.2 This appointment is non-exclusive. The Labour Provider may undertake services for
other clients, and the Provider may engage other Providers or workers to perform similar
services, provided that:

• Such external engagements do not interfere with or adversely affect the Labour
Provider's ability to perform the Services for KSS NW UK LTD; and

• The Labour Provider shall not engage with any known direct competitors of KSS NW UK
LTD for the provision of similar services at any event, location, or client site where the
Labour Provider has been deployed by KSS NW UK LTD, without the prior written
consent of KSS NW UK LTD.

2.3 The Labour Provider may propose to substitute a Worker to perform the Services, but
only with the prior written approval of KSS NW UK LTD. Any proposed substitute must:

• Hold a current, valid Security Industry Authority (SIA) licence appropriate to the role;

• Be subject to vetting by the Provider; and

• Meet all competency, conduct, and uniform requirements stipulated by the Provider.

KSS NW UK LTD reserves the right to reject any proposed substitute for any reasonable cause,
including lack of required skills, licensing, conduct history, or event-specific suitability.

2.4 The Labour Provider shall give as much prior notice as reasonably practicable of the
need for substitution and shall cooperate fully in providing information necessary for vetting
and approval.

2.5 The Labour Provider and any approved Workers shall retain full discretion over how the
Services are performed, subject only to:

• Compliance with legal and regulatory obligations.

• Compatibility with any site-specific requirements of the Provider's Client.

• Event-specific protocols or instructions issued by KSS NW UK LTD.

2.6 The Labour Provider is responsible for the proper performance of the Services and shall
ensure they are carried out with reasonable care, skill, and diligence. The Labour Provider
shall ensure the same standards of performance are upheld by any Worker or substitute
Worker.

2.7 The Labour Provider shall, at their own expense, rectify or re-perform any Services that
are deficient or unsatisfactory.

2.8 This Agreement does not oblige the Provider to offer any minimum amount of work, nor
does it require the Labour Provider to accept any work beyond the scope of this Agreement.
No ongoing mutual obligation or continuing relationship shall be implied by this engagement.

2.9 The Labour Provider shall use reasonable endeavours to ensure compliance with all
instructions reasonably issued by the Provider that relate to health and safety, event-specific
requirements, or scope of delivery—provided such instructions do not compromise the
Labour Provider's independent status.

2.10 The Labour Provider shall ensure full compliance with all applicable laws, SIA
regulations, codes of practice, and site-specific rules relating to the provision of security
services.

2.11 The Provider shall use reasonable endeavours to provide the Labour Provider with all
necessary information and site-specific guidance relevant to the Services.

2.12 The Provider and/or its Client may issue additional reasonable event-specific
instructions, provided these do not materially alter the nature of the Services agreed in
Schedule 1.

2.13 Where any approval, authorisation, or instruction is required from the Provider's Client
to continue the Services, the Provider shall facilitate obtaining such approvals in a timely
manner.

2.14 The Provider shall inform, or ensure the Client informs, the Labour Provider of any
applicable health and safety requirements at the Client's premises or event site.

3. SIA Licensing

3.1 The Labour Provider hereby warrants that he is suitably qualified, trained and SIA
licenced to provide the Services and attaches evidence of such licensing as Schedule 2.

3.2 The Labour Provider hereby undertakes that any Worker engaged by him to perform the
Services under Clause 2 shall also be suitably qualified, trained and SIA licenced and
attaches evidence of the same as Schedule 2.

3.3 The Labour Provider shall promptly inform the Provider of any changes to his or any
Worker's SIA licensing status as described in sub-Clause 3.2.

3.4 The Labour Provider hereby acknowledges that loss of any relevant SIA licences as
described under this Clause 3 shall render the Labour Provider unable to render the
Services and shall result in the immediate termination of this Agreement by the Provider.

4. Indemnity and Insurance

4.1 The Labour Provider must have in place, in relation to the Services, a like policy with like
terms and the same minimum limit of indemnity in any one occurrence which shall cover the
Labour Provider.

4.2 To the extent that the Labour Provider is not covered by the Provider's insurance
described under sub-Clause 4.1, the Labour Provider shall be liable for, and shall indemnify
the Provider against any costs, liability, damages, loss, claims or proceedings in respect of
any injury or damage whatsoever to any property where such injury or damage arises out of
or in the course of or by reason of the performance of the Services; provided that it is due to
the negligence, breach of statutory duty, or omission or default of the Labour Provider, his
servants or agents, or of any person for whom the Labour Provider is responsible.

5. Provision of Equipment

5.1 The Provider at certain agreed events, shall be responsible for the provision of the
following equipment. Each team member will be provided with:

• 2 x Polo shirts.

• 1 x Hi-viz vest.

• 1 x Raincoat.

At the conclusion of the event, all equipment and clothing must be returned. Failure to return
such as items, will be charged to the Labour Provider at the rate of:

• Polo Shirt = £10.00 per item

• Hi-Viz = £25.00 per item

• Waterproof Coat = £25.00 per item

AND

5.2 The Labour Provider shall be responsible for the provision of his own equipment which
shall include the following:

• Camping Equipment.

• Black Trousers.

• Suitable Black Footwear.

• Black Shirts.

• Black Jackets.

6. Status of the Labour Provider

6.1 The Labour Provider's relation to the Provider is that of an independent Provider and
shall have the status of an independent company. The Labour Provider shall be responsible
for all taxes and contributions (including, but not limited to, income tax and national
insurance, where applicable) in respect of all amounts paid or payable to the Labour
Provider under or in relation this Agreement.

6.2 The Labour Provider hereby indemnifies the Provider in respect of any claims that may
be made by the relevant authorities against the Provider in respect of any such taxes and/or
contributions, including interest and penalties, relating to the Services provided by the
Labour Provider hereunder.

6.3 The Labour Provider agrees to be responsible for his expenses and, where applicable,
Value-Added Tax.

7. Payment

7.1 The Provider shall pay the Labour Provider strictly in consideration for the satisfactory
performance of the Services, and in accordance with the provisions of this Clause 7.

7.2 The Provider shall pay the Labour Provider the following fixed hourly rates for approved
personnel, as agreed in advance and as verified by the Provider:

• £16.00 per hour for SIA Door Supervisors.

• £14.00 per hour for non-SIA Stewards.

(These rates are fixed and non-negotiable unless expressly varied in writing by the Provider.)

7.3 Payment shall be subject to all the following conditions:

• The Services must have been completed to the satisfaction of the Provider.

• A valid, itemised invoice must be submitted by the Labour Provider.

• A separate timesheet must be submitted for each deployment, listing the full names
of personnel, role type, hours worked, and the event location.

• Each timesheet must be signed or digitally verified by a KSS NW UK LTD on-site
supervisor as a condition of payment.

• The invoice and timesheet must be reviewed and approved by the Provider before
payment is authorised.

7.4 Any discrepancies between the invoice and the approved timesheet, or any missing or
unverified data, shall suspend the payment timeline until resolved to the satisfaction of the
Provider.

7.5 The Provider shall make payment within 30 calendar days of receiving a valid and
approved invoice with corresponding timesheet(s). Where the due date falls on a non-
Business Day, payment shall be made on the next Business Day without penalty.

7.6 The Provider reserves the right to withhold, reduce, or offset payment in the event of:

• Poor performance or breach of this Agreement by the Labour Provider or any
Worker.

• Inflated or fraudulent invoice claims.

• Failure to comply with KSS NW UK LTD's operational or vetting requirements.

• Deductions related to uniform loss, equipment costs, or performance-related
adjustments under Clause 23.

7.7 All payments under this Agreement are exclusive of Value Added Tax (VAT), which shall
only be payable upon receipt of a valid VAT invoice.

7.8 No further sums shall be due to the Labour Provider under this Agreement. Specifically:

• No expenses, accommodation, meals, travel, subsistence or bonuses shall be
payable unless agreed in writing by the Provider in advance.

• The Provider is under no obligation to provide any minimum hours or guaranteed
income to the Labour Provider.

7.9 The Provider shall not make any payments to individual Workers under any
circumstances. The Labour Provider shall be solely responsible for all tax, National
Insurance, and employment obligations arising from any personnel it engages, and shall fully
indemnify the Provider against any claims arising in this regard.

8. Confidential Information

8.1 Each Party shall at all times keep confidential (and take reasonable steps to procure that
its employees and agents shall keep confidential) and shall not at any time for any reason
disclose or permit to be disclosed to any person or make use of or permit to be made use of
any information relating to the other Party's business methods, plans, systems, finances,
projects, trade secrets or provision of products or services or customers, clients or suppliers,
to which it attaches confidentiality or in respect of which it holds an obligation to a third party.

8.2 Upon termination of this Agreement for whatever reason each Party (the "First Party")
shall deliver to the other Party all working papers or other material and copies which have
either been provided to the First Party by that other Party or have been prepared by the First
Party, in either case pursuant to or for the purposes of this Agreement.

8.3 A separate Non-Disclosure Agreement supports this Consulting agreement, and The
Labour Provider should ensure that any Assistants they employ, sign a copy of the NDA and
it is submitted to the Company, prior to commencing any work in relation to this agreement.

8.4 You must not disclose any secrets or other information of a confidential nature relating to
the Company or its business, or in respect of any obligation of confidence which the
Company owes to any third party, during or after your employment, except in the proper
course of your employment or as required by law.

8.5 Any documents or tangible or intangible items, including intellectual property, which
belong to the Company, or which contain any confidential information must not be removed
from the Company's premises at any time without proper authorisation, and must be
returned to the Company upon request and, in any event, upon the termination of your
employment.

8.6 If requested by the Company, all confidential information, other documents and tangible
items which contain or refer to any confidential information, including client and staff lists,
and which are in your possession or under your control, must be deleted or destroyed. No
company documents, programs, templates are to be copied, removed or sent from the
company.

9. Intellectual Property Rights

9.1 You hereby assign to the Employer your entire right, all present and future rights, title
and interest in and to all discoveries and improvements, patentable or otherwise, trade
secrets and ideas and writings and copyrightable material, which are conceived, developed,
reduced to practice, or acquired by you (collectively, "IP") during your employment and which
relate to the business of KSS NW UK LTD or any of its affiliates, parent companies or
subsidiaries. Intellectual Property includes, but is not limited to, algorithms, code, concepts,
developments, designs, discoveries, ideas, formulas, improvements, inventions, processes,
software, trademarks, and trade secrets.

9.2 Patent and Copyright Registrations: The Labour Provider agrees to co-operate with
the Provider to do whatever is reasonably necessary to obtain the patents and copyrights
required to secure the Employer's ownership rights in the Intellectual Property.

9.3 In relation to IP: The term of this agreement and for a period of 2 years after its
termination or expiry. Following termination of this Agreement, the Employer will have
exclusive ownership rights to all the Labour Provider's post-employment Intellectual Property
that arises from or directly relates to the work for the Employer.

9.4 Return of Data and Documents: Upon termination of this Agreement, the Labour
Provider agrees to immediately return all tangible embodiments of the Intellectual Property,
including but not limited to data, drawings, documents, and notes developed during the
course of the employment.

9.5 Assignment: The Parties may not assign their rights and/or obligations under this
Agreement.

9.6 Severability: In the event any provision of this Agreement is deemed invalid or
unenforceable, in whole or in part, that part shall be severed from the remainder of the
Agreement and all other provisions should continue in full force and effect as valid and
enforceable.

9.7 Successors and Assigns: This Agreement will be binding upon the Labour Provider's
successors, heirs, and assigns for the benefit of the Employer and the Employer's
successors, heirs, and assigns.

9.8 Waiver: Neither Party can waive any provision of this Agreement, or any rights or
obligations under this Agreement, unless agreed to in writing. If any provision, right, or
obligation is waived, it is only waived to the extent agreed to in writing.

10. Tax Liabilities

10.1 The Labour Provider undertakes to the Company that it will:

• pay all tax and National Insurance contributions and make appropriate PAYE
deductions in relation to payments made to it by the Company pursuant to this
Agreement and the remuneration the Labour Provider pays any Assistant/s; and

• indemnify the Company in respect of any claims that may be made by the relevant
authorities against the Company in respect of tax, National Insurance, PAYE or
similar contributions or deductions relating to the Contracting services.

11. Notice

11.1 All notices to be given under this Agreement by either Party to the other shall be in
writing and shall be deemed duly given if signed by the Party giving the notice, or on behalf
of that Party by a duly authorised officer of that Party.

11.2 Notices shall be deemed to have been duly given:

• 11.2.1 when delivered, if delivered by courier or other messenger (including
registered mail) during normal business hours of the recipient; or

• 11.2.2 when sent, if transmitted by e-mail and a return receipt is generated; or

• 11.2.3 on the fifth business day following mailing, if mailed by national ordinary mail,
postage prepaid.

In each case notices shall be addressed to the most recent address or e-mail address
notified to the other Party.

12. Use of Assistant/s

12.1 In this Agreement, "Assistant" means any self-employed person or person employed by
The Labour Provider, nominated and engaged on the Contracting services by The Labour
Provider.

12.2 The Labour Provider in its complete discretion on one or more occasions may
substitute any Assistant for itself or for any other Assistant engaged on the Contracting
services or may engage any additional Assistant, provided that any Assistant chosen by The
Labour Provider has the requisite skills and experience to perform the Contracting services,
with prior notice to the Company.

12.3 The Labour Provider shall use all reasonable endeavours to avoid or minimise such
changes or additions and to consult with the Company beforehand about any such proposed
change in engagement of persons carrying out the Contracting services.

12.4 The Company shall:

• 12.4.1 only be entitled to refuse to accept any Assistant if in its reasonable opinion
they are not suitable due to lack of skills, or experience; and

• 12.4.2 not in any circumstances make any payment to any Assistant.

13. Status of Consultant and Assistant/s and Tax Liability

13.1 The Labour Provider warrants and represents to KSS NW UK LTD that you are an
independent Provider of self-employed status. You undertake to KSS NW UK LTD, that you will
pay all Tax and National Insurance contributions in relation to payments made to you by KSS NW UK LTD, pursuant to this agreement and indemnify KSS NW UK LTD, in respect of any claims
that may be made by the relevant authorities against KSS NW UK LTD, in respect of Tax,
National Insurance, VAT or similar contributions relating to this service. You will be required
to provide proof of your HMRC self-employed tax code, and you accept this is your
responsibility to register and provide details to KSS NW UK LTD.

13.2 Nothing in this Agreement shall render The Labour Provider or any Assistant/s an
employee, agent or partner of the Company, and The Sub-Contractor and any Assistant/s
shall not hold themselves out as such and agree that they are a self-employed Provider and
not an employee of KSS NW UK LTD.

14. Non-Competition and Non-Solicitation

14.1 The Labour Provider shall not, during provision of the Services or for a period of 24
months, following the termination or expiry of this Agreement, provide like services to any
competitor of the Provider of Events. The Provider may waive this restriction entirely or on a
per-competitor basis upon receipt of a written request from the Labour Provider.

14.2 The Labour Provider shall not, during the course of provision of the Services or for a
period of 24 months, following the termination or expiry of this Agreement, solicit the
Provider's Client (or any other of the Provider's clients) and/or employees with which the
Labour Provider has had dealings during the 12 months prior to the date of termination or
expiry or any other clients of which the Labour Provider has knowledge.

15. Data Protection

The Labour Provider will only use the Provider's personal information as set out in the
Labour Provider's privacy notice available from KSS NW UK LTD.

16. Term and Termination

16.1 This Agreement shall come into effect on 27th March 2026 and shall continue in force
for the Term set out in Schedule 1 or until terminated in accordance with this Clause 16.

16.2 This Agreement is terminable at any time and with immediate effect by the Provider or
by the Labour Provider by giving the other written notice, without giving any reason for such
termination.

16.3 Without prejudice to the generality of clause 16.2, this Agreement shall terminate,
notwithstanding any other rights and remedies the Parties may have, in the following
circumstances:

• 16.3.1 either Party fails to comply with the terms and obligations of this Agreement
and such failure, if capable of remedy, is not remedied within fourteen days of written
notice of such failure from the other Party.

• 16.3.2 the Labour Provider goes into bankruptcy or liquidation either voluntary or
compulsory (save for the purposes of bona fide corporate reconstruction or
amalgamation) or if a receiver is appointed in respect of the whole or any part of its
assets.

16.4 Upon the termination of this Agreement for any reason:

• 16.4.1 Any sum owing by the Labour Provider under any of the provisions of this
Agreement shall become immediately due and payable.

• 16.4.2 Any rights or obligations to which any of the Parties may be entitled or be
subject before its termination shall remain in full force and effect.

• 16.4.3 Termination shall not affect or prejudice any right to damages or other remedy
which the terminating Party may have in respect of the event giving rise to the
termination or any other right to damages or other remedy which any Party may have
in respect of any breach of this Agreement which existed at or before the date of
termination.

16.5 Subject to any express provisions to the contrary in this Agreement and except in
respect of any accrued rights, neither Party shall be under any further obligation to the other;
and

16.6 Each Party shall (except to the extent referred to in Clause 9) immediately cease to
use, either directly or indirectly, any Confidential Information, and shall immediately return to
the other Party any documents in its possession or control which contain or record any
Confidential Information.

17. Force Majeure

17.1 Neither Party to this Agreement shall be liable for any failure or delay in performing their
obligations where such failure or delay results from any because that is beyond the
reasonable control of that Party ("Force Majeure"). Such causes include, but are not limited
to power failure, Internet Service Provider failure, industrial action, civil unrest, fire, flood,
storms, earthquakes, acts of terrorism, acts of war, governmental action or any other similar
or dissimilar event or circumstance that is beyond the control of the Party in question.

18. Entire Agreement

18.1 This Agreement contains the whole agreement between the Labour Provider and the
Provider with respect to its subject matter and supersedes any prior agreement between the
Parties whether written or oral and such prior agreements are cancelled as from the date
hereof and both Parties acknowledge they have no claim against the other in respect of any
previous agreement.

18.2 This Agreement may not be modified except by an instrument in writing signed by the
duly authorised representatives of the Parties

18.3 Each Party acknowledges that, in entering into this Agreement, it does not rely on any
representation, warranty or other provision except as expressly provided in this Agreement,
and all conditions, warranties or other terms implied by statute or common law are fully
excluded permitted by law.

19. Assignment and Sub-Contracting

19.1 The Labour Provider shall be entitled to perform any of the obligations undertaken by it
through any suitably qualified and skilled Labour Providers. Any act or omission of such
Labour Provider shall, for the purposes of this Agreement, be deemed to be an act or
omission of the Labour Provider.

20. Relationship of the Parties

Nothing in this Agreement shall create or be deemed to constitute or give rise to a
partnership, joint venture, agency or any employment relationships between the Parties, or
any employment relationship between any Worker and [either] the Provider [or the Labour
Provider], or any other fiduciary relationship, other than the contractual relationship
expressly provided for in this Agreement.

21. Third Party Rights

21.1 No one other than a Party to this Agreement, their transferees, successors or
assignees, shall have any right to enforce any of its terms and accordingly the Contracts
(Rights of Third Parties) Act 1999 shall not apply to this Agreement.

21.2 Subject to this Clause 21, this Agreement shall continue and be binding on the
transferee, successors and assignees of either Party as required.

22. Working in the Republic of Ireland

22.1. The Sub-Contractor agrees to perform the Services in the Republic of Ireland as
required by the Provider.

22.2. KSS NW UK will front the cost of all training and licenses necessary for the Labour Provider's
work in Ireland. However, the Labour Provider shall be responsible for reimbursing KSS NW UK for
such costs, which shall be deducted from the Labour Provider's first invoice to KSS NW UK LTD.

23. Performance Adjustment Protocol

23.1. KSS NW UK LTD shall implement a performance-based service rate adjustment
framework (the "Adjustment Protocol") applicable to subcontracted personnel during the
Term of this Agreement. This framework is intended to maintain service standards and
does not constitute a disciplinary procedure or imply any employment relationship.

23.2. Where the conduct or performance of a Worker is deemed by KSS NW UK LTD, in its
reasonable opinion, to fall below acceptable professional standards, KSS NW UK LTD may
issue a written YELLOW Notice. The issuance of a YELLOW Notice shall trigger a rate
adjustment whereby the agreed service rate for that Worker will be reduced by an amount
equivalent to half of their daily contract value for the applicable assignment.

23.3. In the event of serious misconduct or repeated failure to meet professional standards,
KSS NW UK LTD may issue a RED Notice, resulting in a rate adjustment equivalent to a full
day's contract value for the relevant Worker. Additionally, the Worker may be temporarily
suspended from future assignments, including the next scheduled day, at the sole discretion
of KSS NW UK LTD.

23.4. All Notices under this Clause shall be issued in writing and justified with reference to
documented observations or incident reports. KSS NW UK LTD's decision regarding Notices
and resulting adjustments shall be final and binding, provided it is not made arbitrarily or in
bad faith.

23.5. The Parties acknowledge and agree that:

• All adjustments are made to the contractual service rate payable under this
Agreement and do not constitute deductions from wages;

• The Workers are engaged as independent Providers;

• This Clause operates as a commercial mechanism to safeguard KSS NW UK LTD's
quality standards and reputational interests.

24. Notices

24.1 All notices under this Agreement shall be in writing and be deemed duly given if signed
by, or on behalf of, a duly authorised officer of the Party giving the notice.

24.2 Notices shall be deemed to have been duly given:

• 24.2.1 when delivered, if delivered by courier or other messenger (including
registered mail) during normal business hours of the recipient; or

• 24.2.2 when sent, if transmitted by e-mail and a return receipt is generated; or

• 24.2.3 on the fifth Business Day following mailing, if mailed by national ordinary mail,
postage prepaid.

In each case notices shall be addressed to the most recent address or e-mail address
number notified to the other Party.

25. Severance

The Parties agree that, if one or more of the provisions of this Agreement is found to be
unlawful, invalid or otherwise unenforceable, that / those provision(s) shall be deemed
severed from the remainder of this Agreement. The remainder of this Agreement shall be
valid and enforceable.

26. No Waiver

No failure or delay by either Party in exercising any of its rights under this Agreement shall
be deemed to be a waiver of that right, and no waiver by either Party of a breach of any
provision of this Agreement shall be deemed to be a waiver of any subsequent breach of the
same or any other provision.

27. Law and Jurisdiction

27.1 This Agreement, and any dispute or claim (including any non-contractual disputes or
claims) arising out of or in connection with it, its subject matter or formation, shall be
governed by and construed in accordance with the laws of England and Wales.

27.2 The Parties irrevocably agree that the courts of England and Wales shall have
exclusive jurisdiction to settle any dispute or claim (including non-contractual disputes or
claims) arising out of or in connection with this Agreement or its subject matter or formation.

IN WITNESS WHEREOF this Agreement has been duly executed the day and year first
before written.

SIGNED by

Garry Longthorne - Director

for and on behalf of KSS NW UK LTD

In the presence of

Jack Longthorne - Director

SIGNED by

Signature: ${provider.signed_name || '[Signature]'}

Name: ${provider.signed_name || '[Name]'}

for and on behalf of ${provider.company_name}

In the presence of

Name: _________________________________________

SCHEDULE 1

The Services

As specified by the event deployment schedules.

Term (duration)

2026 Summer Festival Season (May-September)

SCHEDULE 2

SIA Licensing

List of SIA license holders provided on a PNC document for each agreed festival
assignments.

SCHEDULE 3

Insurance

Copy of Insurance

SCHEDULE 4

Privacy Notice

BACKGROUND:

KSS NW UK LTD understands that your privacy is important to you and that you care about how
your personal data is used. We respect and value the privacy of all our Client's; Labour
Providers; Partners and employees and will only collect and use personal data in ways that
are described here, and in a way that is consistent with our obligations and your rights under
the law.

Information About Us

KSS NW UK LTD.

Limited Company registered in England under company number 09239103.

Address: St Peters House, Sliverwell Street, Bolton, BL1 1PP.

VAT number: 210477341

Data Protection Officer: Garry Longthorne.

Email address: info@kssnwltd.co.uk.

Telephone number: 07947 694 353

Representative: Jack Longthorne.

Email address: jack@kssnwltd.co.uk.

Telephone number: 07984 010 447.

Postal address: St Peter House, Silverwell Street, Bolton BL1 1PP.

We are regulated by the Security Industry Authority for certain business tasks.

We are a member of ROSPA

SIA ACS – KSNWLISC01

What Does This Notice Cover?

This Privacy Information explains how we use your personal data: how it is collected, how it
is held, and how it is processed. It also explain your rights under the law relating to your
personal data and expect the same level of compliance from our business partners.

What Is Personal Data?

Personal data is defined by the UK GDPR and the Data Protection Act 2018 (collectively,
"the Data Protection Legislation") as 'any information relating to an identifiable person who
can be directly or indirectly identified in particular by reference to an identifier'.

What Are My Rights?

Under the Data Protection Legislation, you have the following rights, which we will always
work to uphold:

1. The right to be informed about our collection and use of your personal data.

2. The right to access the personal data we hold about you.

3. The right to have your personal data rectified if any of your personal data held by us
is inaccurate or incomplete.

4. The right to be forgotten, i.e., the right to ask us to delete or otherwise dispose of any
of your personal data that we hold.

5. The right to restrict (i.e. prevent) the processing of your personal data.

6. The right to object to us using your personal data for a particular purpose or
purposes.

7. The right to withdraw consent.

8. The right to data portability.

9. Rights relating to automated decision-making and profiling.

What Personal Data Do You Collect and How?

We may collect and hold some or all the personal and non-personal data set out in the table
below:

Data Collected | How We Collect the Data
Identity Information including Names | Electronic App
Contact information including Mobile Numbers | Electronic App
Business information including Business name; Company Number; VAT; Email and Telephone contact details | Invoice; email; text; mobile phone
Payment information including Bank Details | Invoice
Data from third parties including SIA verification number | SIA Website - Open domain

How Do You Use My Personal Data?

| What We Do | What Data We Use | Our Lawful Basis |
| :--- | :--- | :--- |
| Administering our business | Contact Names, Numbers, Addresses; Emails, SIA Licences Numbers, DoB | Legitimate Business interest |
| Supplying our services to clients and partners | Contact Names, Numbers, Addresses; Emails, SIA Licences Numbers, DoB | Legitimate Business interest |
| Managing payments for our services and paying wages and Business partners | Bank Details; Vat Number; Company / Personal Names and addresses | Legitimate Business interest |
| Communicating with you | Name; Address; Telephone Numbers; Email Addresses | Legitimate Business interest |

How Long Will You Keep My Personal Data?

We will not keep your personal data for any longer than is necessary considering the
reason(s) for which it was first collected.

How and Where Do You Store or Transfer My Personal Data?

We will only store your personal data in the UK. This means that it will be fully protected
under the Data Protection Legislation. We ensure that your personal data is protected under
binding corporate rules.

The security of your personal data is essential to us and to protect your data, we take
several important measures, including:

• limiting access to your personal data to those employees, agents, Providers, and
other third parties with a legitimate need to know and ensuring that they are subject to
duties of confidentiality.

• procedures for dealing with data breaches.

Do You Share My Personal Data?

We will not share any of your personal data with any third parties for any purposes, subject
to the following exception[s]:

• If we sell, transfer, or merge parts of our business or assets.

• In some limited circumstances, where we are legally required to share certain
personal data (legal proceedings, court orders, etc).

How Can I Access My Personal Data?

If you want to know what personal data we have about you, you can ask us for details of that
personal data and for a copy of it (where any such personal data is held). This is known as a
"subject access request".

How Do I Contact You?

To contact us about anything to do with your personal data and data protection, including to
make a subject access request, please use the following details for the attention of Garry
Longthorne:

Email address: info@kssnwltd.co.uk.

Telephone number: 07947 694 353.

Postal Address: St Peters House, Sliverwell Street, Bolton, BL1 1PP.

Changes to this Privacy Notice

We may change this Privacy Notice from time to time. This may be necessary, for example,
if the law changes, or if we change our business in a way that affects personal data
protection.

Any changes will be made available www.kssnwltd.co.uk. This Privacy Notice was last
updated on 1st Day of April 2026.`;
}

export function generateNDAAgreement(provider: {
  company_name: string;
  address: string;
  director_contact_name?: string;
  signed_name?: string;
  signed_date?: string;
}): string {
  const today = provider.signed_date ? new Date(provider.signed_date) : new Date();
  const day = today.getDate();
  const month = today.toLocaleString('en-GB', { month: 'long' });
  const year = today.getFullYear();
  const dateStr = `${day} ${month} ${year}`;

  return `NON-DISCLOSURE AND DATA PROTECTION AGREEMENT

This Agreement is made on ${dateStr}

BETWEEN

(1) KSS NW UK LTD, a company incorporated and registered in England and Wales with company number 09239103 and registered office at St Peters House, Sliverwell Street, Bolton, BL1 1PP ("KSS NW UK");

AND

(2) ${provider.company_name}, of ${provider.address} ("the Subcontractor").

BACKGROUND

KSS NW UK and the Subcontractor intend to work together on the provision of security services. During such engagement, the Subcontractor will be granted access to the KSS NW UK Operations Portal, proprietary data, and sensitive operational instructions. KSS NW UK requires that all such information is kept strictly confidential, secure, and used solely for the agreed purpose.

IT IS AGREED as follows:

1. Definition of Confidential Information

1.1 "Confidential Information" shall include all information, whether verbal, written, digital, or otherwise, shared by KSS NW UK with the Subcontractor. This specifically includes, but is not limited to:

Operational Data: Deployment schedules, site maps, briefing packs, and client instructions.

Commercial Data: Rates of pay, charge rates, contractual terms, and invoice details.

Portal Access: Login credentials, software architecture, user interface designs, and any data contained within the KSS NW UK Operations Portal.

Personal Data: Names, SIA numbers, and contact details of staff members or third parties.

2. Obligations of Confidentiality

2.1 The Subcontractor agrees to keep all Confidential Information strictly private and confidential.

2.2 The Subcontractor shall not disclose Confidential Information to any third party, individual, company, or entity without the prior written consent of KSS NW UK.

2.3 This obligation shall continue indefinitely beyond the termination of any working relationship between KSS NW UK and the Subcontractor.

3. Digital Security & Portal Usage

3.1 Access Control: The Subcontractor must not share their unique KSS NW UK Portal login credentials (username/password) with any other individual, including their own staff, unless authorized by KSS NW UK.

3.2 Data Scraping: The Subcontractor is prohibited from using automated scripts, scrapers, or bots to extract data from the KSS NW UK Portal.

3.3 Screenshots: The Subcontractor must not take screenshots, screen recordings, or photos of the KSS NW UK Portal dashboard to share on public forums or messaging apps.

4. Prohibited Communications

4.1 The Subcontractor must not share or communicate any information relating to work with KSS NW UK on:

Messaging Applications: Public groups on WhatsApp, Telegram, Signal, or similar platforms where access is not strictly controlled.

Social media: LinkedIn, Facebook, Instagram, X (formerly Twitter), TikTok, Snapchat, or any other public digital forum.

4.2 The Subcontractor must not post, share, or otherwise disclose rates of pay or specific client locations prior to official public release by the event organizer.

5. Non-Circumvention

5.1 The Subcontractor agrees not to use any Confidential Information (including client lists or contact details found within the KSS NW UK Portal) to solicit, contact, or attempt to contract directly with KSS NW UK's clients (e.g., Festival Organizers) regarding the provision of security services, thereby bypassing KSS NW UK.

6. Data Protection (GDPR)

6.1 Both parties agree to comply with all applicable requirements of the Data Protection Act 2018 and UK GDPR.

6.2 The Subcontractor agrees that any Personal Data (e.g., Staff Lists, SIA Badges) uploaded to the KSS NW UK Portal is accurate and that they have the necessary consent from their staff to share this data with KSS NW UK for accreditation purposes.

7. Breach and Legal Consequences

7.1 Any breach of this Agreement will result in immediate legal action, including but not limited to:

Immediate suspension of access to the KSS NW UK Portal.

Injunctive relief to prevent further disclosure.

Financial damages for loss of business or competitive advantage.

Pursuit of claims for defamation or reputational harm.

7.2 KSS NW UK reserves the right to terminate all existing and future engagements with the Subcontractor immediately upon breach.

8. Ownership and Return of Information

8.1 All documents, data, records, and software access rights supplied by KSS NW UK remain the property of KSS NW UK.

8.2 Upon request or termination of the agreement, the Subcontractor must return or permanently delete all digital copies of KSS NW UK Confidential Information.

9. Governing Law

9.1 This Agreement shall be governed by and construed in accordance with the laws of England and Wales.

9.2 The parties agree to submit to the exclusive jurisdiction of the courts of England and Wales.

IN WITNESS WHEREOF the parties have executed this Non-Disclosure Agreement as of the date first above written.

Signed for and on behalf of KSS NW UK LTD
Name: Garry Longthorne
Position: Director
Signature: ____________________
Date: ${dateStr}

Signed by the Subcontractor
Name: ${provider.signed_name || provider.director_contact_name || '[Name]'}
Position: Director
Signature: ${provider.signed_name || provider.director_contact_name || '[Signature]'}
Date: ${dateStr}`;
}

