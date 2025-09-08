from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import requests
import os
import smtplib
import re
import time
import os
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication
app = Flask(__name__)

# Enable CORS
CORS(app)

# Adzuna API credentials
ADZUNA_APP_ID = "23c1b28a"
ADZUNA_API_KEY = "4b9b103c5696357dc79c7c98d7ba5d6d"
COUNTRY_CODE = "za"

# Email configuration (update these with your actual credentials)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_USERNAME = "jobly.recruitment001@gmail.com"
EMAIL_PASSWORD = "tonpxxevmsgestzy"
ADMIN_EMAIL = "jobly.recruitment001@gmail.com"

# Department categorization with improved precision
DEPARTMENT_KEYWORDS = {
    "Accounting and Finance": [
        r'\baccountant\b', r'\bfinance\b', r'\baudit\b', r'\bbookkeeper\b', 
        r'\btax\b', r'\bpayroll\b', r'\bcfo\b', r'\bfinancial\b', r'\baccounting\b',
        r'\bcpa\b', r'\bca\b', r'\bchartered accountant\b', r'\bfinancial analyst\b'
    ],
    "Building and Construction": [
        r'\bconstruction\b', r'\bbuilder\b', r'\barchitect\b', r'\bcivil engineer\b', 
        r'\bcarpenter\b', r'\bplumber\b', r'\belectrician\b', r'\bcontractor\b', 
        r'\bbuilding\b', r'\bconstruction manager\b', r'\bproject manager\b', 
        r'\bquantity surveyor\b', r'\bforeman\b'
    ],
    "Business Management": [
        r'\bmanager\b', r'\bmanagement\b', r'\bbusiness\b', r'\bexecutive\b', 
        r'\bdirector\b', r'\bconsultant\b', r'\bstrategist\b', r'\boperations\b', 
        r'\bbusiness development\b', r'\bceo\b', r'\bcto\b', r'\bcoo\b', 
        r'\bproject manager\b', r'\bteam lead\b', r'\bsupervisor\b'
    ],
    "Creativity and Media": [
        r'\bdesigner\b', r'\bartist\b', r'\bmedia\b', r'\bcreative\b', 
        r'\bphotographer\b', r'\bwriter\b', r'\beditor\b', r'\bcontent\b', 
        r'\bgraphic\b', r'\bvideo\b', r'\bui/ux\b', r'\bux/ui\b', r'\bweb designer\b',
        r'\bcontent creator\b', r'\bcopywriter\b'
    ],
    "Defense and Security": [
        r'\bsecurity\b', r'\bpolice\b', r'\bdefense\b', r'\bmilitary\b', 
        r'\bsafety\b', r'\bguard\b', r'\barmed\b', r'\bprotection\b', 
        r'\bpatrol\b', r'\bofficer\b', r'\bsecurity officer\b', r'\barmy\b',
        r'\bnavy\b', r'\bair force\b'
    ],
    "Education": [
        r'\bteacher\b', r'\blecturer\b', r'\beducator\b', r'\btutor\b', 
        r'\bprofessor\b', r'\bschool\b', r'\buniversity\b', r'\bcollege\b', 
        r'\binstructor\b', r'\btraining\b', r'\beducation\b', r'\bprincipal\b',
        r'\bheadmaster\b', r'\bheadmistress\b'
    ],
    "Engineering": [
        r'\bengineer\b', r'\bmechanical\b', r'\belectrical\b', r'\bchemical\b', 
        r'\bindustrial\b', r'\btechnician\b', r'\btechnical\b', r'\bdevelopment\b', 
        r'\bdesign\b', r'\bdevops\b', r'\bsoftware engineer\b', r'\bcivil engineer\b',
        r'\bnetwork engineer\b', r'\bsystems engineer\b', r'\bqa engineer\b',
        r'\bquality assurance\b', r'\bautomation engineer\b'
    ],
    "Health": [
        r'\bdoctor\b', r'\bnurse\b', r'\bmedical\b', r'\bhealthcare\b', 
        r'\bpharmacist\b', r'\bdentist\b', r'\bhospital\b', r'\bclinic\b', 
        r'\btherapist\b', r'\bcaregiver\b', r'\bphysician\b', r'\bsurgeon\b',
        r'\bparamedic\b', r'\bpharmacy\b', r'\bpsychologist\b'
    ],
    "Public Relations": [
        r'\bpr\b', r'\bpublic relations\b', r'\bcommunication\b', r'\bmarketing\b', 
        r'\badvertising\b', r'\bbrand\b', r'\bsocial media\b', r'\bcampaign\b', 
        r'\boutreach\b', r'\bdigital marketing\b', r'\bmarketing manager\b',
        r'\bcommunications officer\b'
    ],
    "Technology": [
        r'\bdeveloper\b', r'\bprogrammer\b', r'\bit\b', r'\bsoftware\b', 
        r'\bdata\b', r'\banalyst\b', r'\bcyber\b', r'\bsystem\b', 
        r'\bnetwork\b', r'\bdatabase\b', r'\bweb\b', r'\bapp\b', 
        r'\bfrontend\b', r'\bbackend\b', r'\bfull stack\b', r'\bdata scientist\b',
        r'\bai\b', r'\bartificial intelligence\b', r'\bml\b', r'\bmachine learning\b',
        r'\bcloud\b', r'\bazure\b', r'\baws\b'
    ],
    "Tourism": [
        r'\btourism\b', r'\btravel\b', r'\bhotel\b', r'\btour guide\b', 
        r'\bhospitality\b', r'\bchef\b', r'\brestaurant\b', r'\baccommodation\b', 
        r'\bresort\b', r'\btourist\b', r'\bhotel manager\b', r'\bconcierge\b',
        r'\btravel agent\b'
    ],
    "Transport": [
        r'\bdriver\b', r'\blogistics\b', r'\btransport\b', r'\bsupply chain\b', 
        r'\bshipping\b', r'\bdelivery\b', r'\bcourier\b', r'\bfleet\b', 
        r'\btruck\b', r'\blogistic\b', r'\blogistics manager\b', r'\bfleet manager\b',
        r'\btransport manager\b'
    ],
    "Sales": [
        r'\bsales\b', r'\baccount manager\b', r'\bbusiness development\b', 
        r'\brepresentative\b', r'\bretail\b', r'\bmerchandiser\b', 
        r'\bclient executive\b', r'\bsales executive\b', r'\bsales manager\b',
        r'\bsales representative\b'
    ],
    "Human Resources": [
        r'\bhr\b', r'\bhuman resources\b', r'\brecruiter\b', r'\btalent\b', 
        r'\brecruitment\b', r'\bpeople operations\b', r'\bhiring\b',
        r'\bhr manager\b', r'\bhr business partner\b', r'\btalent acquisition\b'
    ],
    "Customer Service": [
        r'\bcustomer service\b', r'\bsupport\b', r'\bcall center\b', 
        r'\bhelpdesk\b', r'\bclient service\b', r'\bcontact center\b',
        r'\bcustomer support\b', r'\bservice agent\b', r'\bcall centre\b'
    ],
    "Other": []  # Catch-all category
}

# Expanded company email mapping
COMPANY_EMAILS = {
    "default": ADMIN_EMAIL,
    "absa": "careers@absa.africa",
    "standard bank": "careers@standardbank.co.za",
    "nedbank": "recruitment@nedbank.co.za",
    "fnb": "careers@fnb.co.za",
    "capitec": "jobs@capitecbank.co.za",
    "mtn": "careers@mtn.com",
    "vodacom": "recruitment@vodacom.co.za",
    "telkom": "jobs@telkom.co.za",
    "sasol": "careers@sasol.com",
    "shoprite": "recruitment@shoprite.co.za",
    "pick n pay": "jobs@pnp.co.za",
    "woolworths": "careers@woolworths.co.za",
    "discovery": "jobs@discovery.co.za",
    "old mutual": "careers@oldmutual.com",
    "sanlam": "recruitment@sanlam.co.za",
    "eskom": "jobs@eskom.co.za",
    "transnet": "careers@transnet.net",
    "dept of health": "recruitment@health.gov.za",
    "dept of education": "jobs@education.gov.za",
    "multichoice": "careers@multichoice.co.za",
    "naspers": "careers@naspers.com",
    "takealot": "careers@takealot.com",
    "mr price": "careers@mrpgroup.com",
    "truworths": "careers@truworths.co.za",
    "foschini": "careers@foschinigroup.com",
    "liberty": "careers@liberty.co.za",
    "momentum": "careers@momentum.co.za",
    "investec": "careers@investec.co.za",
    "bmw": "careers@bmw.co.za",
    "mercedes-benz": "careers@mercedes-benz.co.za",
    "volkswagen": "careers@volkswagen.co.za",
    "ford": "careers@ford.co.za",
    "toyota": "careers@toyota.co.za",
    "nissan": "careers@nissan.co.za",
    "audi": "careers@audi.co.za",
    "pepsico": "careers@pepsico.com",
    "coca-cola": "careers@coca-cola.com",
    "sab": "careers@sab.co.za",
    "heineken": "careers@heineken.co.za",
    "distell": "careers@distell.co.za",
    "unilever": "careers@unilever.co.za",
    "procter & gamble": "careers@pg.com",
    "nestle": "careers@nestle.co.za",
    "kellogg's": "careers@kelloggs.co.za",
    "mondelēz": "careers@mondelezinternational.com",
    "glaxosmithkline": "careers@gsk.com",
    "pfizer": "careers@pfizer.com",
    "novartis": "careers@novartis.com",
    "roche": "careers@roche.com",
    "johnson & johnson": "careers@jnj.com",
    "siemens": "careers@siemens.com",
    "bosch": "careers@bosch.com",
    "schneider electric": "careers@schneider-electric.com",
    "abb": "careers@abb.com",
    "general electric": "careers@ge.com",
    "ibm": "careers@ibm.com",
    "microsoft": "careers@microsoft.com",
    "google": "careers@google.com",
    "amazon": "careers@amazon.com",
    "apple": "careers@apple.com",
    "oracle": "careers@oracle.com",
    "sap": "careers@sap.com",
    "accenture": "careers@accenture.com",
    "deloitte": "careers@deloitte.com",
    "pwc": "careers@pwc.com",
    "ey": "careers@ey.com",
    "kpmg": "careers@kpmg.com",
    "bcg": "careers@bcg.com",
    "mckinsey": "careers@mckinsey.com",
    "bain": "careers@bain.com",
    "j.p. morgan": "careers@jpmorgan.com",
    "goldman sachs": "careers@goldmansachs.com",
    "morgan stanley": "careers@morganstanley.com",
    "barclays": "careers@barclays.com",
    "hsbc": "careers@hsbc.com",
    "standard chartered": "careers@sc.com",
    "citibank": "careers@citi.com",
    "deutsche bank": "careers@db.com",
    "credit suisse": "careers@credit-suisse.com",
    "ubs": "careers@ubs.com",
    "bnp paribas": "careers@bnpparibas.com",
    "societe generale": "careers@socgen.com",
}

def categorize_job(title, description=""):
    if not title:
        return "Other"
    
    title_lower = title.lower()
    description_lower = description.lower() if description else ""
    text_to_search = title_lower + " " + description_lower
    
    for department, patterns in DEPARTMENT_KEYWORDS.items():
        for pattern in patterns:
            if re.search(pattern, text_to_search, re.IGNORECASE):
                return department
    return "Other"

def fetch_jobs(keyword=None, department=None, page=1, max_results=100):
    all_jobs = []
    max_pages = 5  # Fetch up to 5 pages of results
    
    print(f"Fetching jobs - Keyword: {keyword}, Department: {department}")
    
    for current_page in range(1, max_pages + 1):
        url = f"https://api.adzuna.com/v1/api/jobs/{COUNTRY_CODE}/search/{current_page}"
        params = {
            "app_id": ADZUNA_APP_ID,
            "app_key": ADZUNA_API_KEY,
            "results_per_page": 50,  # Max results per page
            "sort_by": "date",  # Sort by date to get newest jobs
            "max_days_old": 30  # Only get jobs from the last 30 days
        }
        
        if keyword:
            params["what"] = keyword
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Check if we got rate limited
            if response.status_code == 429:
                print("Rate limited - waiting before retry")
                time.sleep(2)
                continue
                
            if not data.get("results"):
                print(f"No results on page {current_page}")
                break
                
            for job in data.get("results", []):
                job_department = categorize_job(job.get("title"), job.get("description"))
                print(f"Job: {job.get('title')} -> Department: {job_department}")
                
                # Apply department filter if specified (and not "All Industries")
                if department and department != "All Industries":
                    if job_department.lower() != department.lower():
                        continue
                        
                # Calculate days ago
                created = job.get("created")
                days_ago = None
                if created:
                    try:
                        created_date = datetime.strptime(created, "%Y-%m-%dT%H:%M:%SZ")
                        days_ago = (datetime.now() - created_date).days
                    except ValueError:
                        days_ago = None
                
                all_jobs.append({
                    "id": job.get("id"),
                    "title": job.get("title"),
                    "company": job.get("company", {}).get("display_name"),
                    "location": job.get("location", {}).get("display_name"),
                    "salary_min": job.get("salary_min"),
                    "salary_max": job.get("salary_max"),
                    "salary_is_predicted": job.get("salary_is_predicted"),
                    "url": job.get("redirect_url"),
                    "department": job_department,
                    "description": job.get("description", ""),
                    "created": created,
                    "days_ago": days_ago,
                    "contract_type": job.get("contract_type"),
                    "category": job.get("category", {}).get("label"),
                    "latitude": job.get("latitude"),
                    "longitude": job.get("longitude")
                })
                
                # Stop if we've reached the max results
                if len(all_jobs) >= max_results:
                    break
                    
            # Stop if we've reached the max results
            if len(all_jobs) >= max_results:
                break
                
        except requests.exceptions.Timeout:
            print("Request timeout")
            continue
        except requests.exceptions.RequestException as e:
            print(f"Error fetching jobs from Adzuna API (page {current_page}): {str(e)}")
            break
        except ValueError as e:
            print(f"Error parsing JSON response (page {current_page}): {str(e)}")
            break
    
    print(f"Fetched {len(all_jobs)} jobs")
    return all_jobs

def get_company_email(company_name):
    """Get company email from mapping or return default"""
    if not company_name:
        return COMPANY_EMAILS["default"]
    
    # Try to find a matching email (case insensitive)
    company_lower = company_name.lower().strip()
    for company_key, email in COMPANY_EMAILS.items():
        if company_key.lower() in company_lower:
            return email
    
    return COMPANY_EMAILS["default"]

def send_application_email(job_id, job_title, company_name, name, email, phone, cover_letter, resume_path):
    # Get the appropriate company email
    company_email = get_company_email(company_name)
    
    # Create message for the company
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USERNAME
    msg['To'] = company_email
    msg['Subject'] = f"Job Application: {job_title} at {company_name} - {name}"
    
    # Create email body
    body = f"""
    New Job Application Received:
    
    Position: {job_title}
    Company: {company_name}
    Applicant Name: {name}
    Email: {email}
    Phone: {phone}
    
    Cover Letter:
    {cover_letter}
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Attach resume
    if resume_path and os.path.exists(resume_path):
        with open(resume_path, "rb") as f:
            file_ext = os.path.splitext(resume_path)[1].lower()
            subtype = "octet-stream"
            if file_ext == ".pdf":
                subtype = "pdf"
            elif file_ext in [".doc", ".docx"]:
                subtype = "msword"
                
            attach = MIMEApplication(f.read(), _subtype=subtype)
            attach.add_header('Content-Disposition', 'attachment', filename=os.path.basename(resume_path))
            msg.attach(attach)
    
    # Send email to company
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)
        print(f"Application email sent to {company_email}")
        
        # Also send a copy to the admin for record keeping
        if company_email != ADMIN_EMAIL:
            msg['To'] = ADMIN_EMAIL
            server.send_message(msg)
            print(f"Copy of application email sent to {ADMIN_EMAIL}")
            
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending application email: {str(e)}")
        return False

def send_confirmation_email(applicant_email, job_title, company_name, applicant_name):
    """Send confirmation email to the applicant"""
    msg = MIMEMultipart()
    msg['From'] = EMAIL_USERNAME
    msg['To'] = applicant_email
    msg['Subject'] = f"Application Confirmation: {job_title} at {company_name}"
    
    body = f"""
    Dear {applicant_name},

        Thank you for applying for the position of {job_title} at {company_name}.
        
        We have successfully received your application and it has been forwarded to the hiring team.
        
        They will review your qualifications and contact you if you are selected for an interview.
        
        Please allow some time for the hiring team to review all applications.
        
    Best regards,
    Recruitment Team
    South African Jobs Platform
    """
    
    msg.attach(MIMEText(body, 'plain'))
    
    # Send confirmation email
    try:
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(EMAIL_USERNAME, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Confirmation email sent to {applicant_email}")
        return True
    except Exception as e:
        print(f"Error sending confirmation email: {str(e)}")
        return False

@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/jobs')
def get_jobs():
    try:
        keyword = request.args.get('keyword')
        department = request.args.get('department')
        
        # Handle "All Industries" case
        if department == "All Industries" or department == "":
            department = None
            
        page = int(request.args.get('page', 1))
        
        # Fetch more jobs with pagination
        jobs = fetch_jobs(keyword=keyword, department=department, page=page, max_results=100)
        return jsonify(jobs)
    except Exception as e:
        print(f"Error in /jobs endpoint: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/departments')
def get_departments():
    return jsonify(list(DEPARTMENT_KEYWORDS.keys()))

@app.route('/apply', methods=['POST'])
def handle_application():
    try:
        # Get form data
        job_id = request.form.get('job_id')
        job_title = request.form.get('job_title')
        company_name = request.form.get('company_name')
        name = request.form.get('name')
        email = request.form.get('email')
        phone = request.form.get('phone')
        cover_letter = request.form.get('cover_letter')
        resume = request.files.get('resume')
        
        # Validate required fields
        if not all([job_id, job_title, name, email, phone, resume]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Create uploads directory if it doesn't exist
        if not os.path.exists('uploads'):
            os.makedirs('uploads')
        
        # Save the resume temporarily
        resume_filename = f"{name.replace(' ', '_')}_{job_id}_resume.{resume.filename.split('.')[-1]}"
        resume_path = os.path.join('uploads', resume_filename)
        resume.save(resume_path)
        
        # Send email to company
        application_sent = send_application_email(
            job_id, job_title, company_name, name, email, phone, cover_letter, resume_path
        )
        
        # Send confirmation email to applicant
        confirmation_sent = send_confirmation_email(email, job_title, company_name, name)
        
        # Clean up - remove the temporary file
        if os.path.exists(resume_path):
            os.remove(resume_path)
        
        if application_sent:
            return jsonify({
                "message": "Application submitted successfully", 
                "confirmation_sent": confirmation_sent
            }), 200
        else:
            return jsonify({"error": "Failed to send application"}), 500
        
    except Exception as e:
        print(f"Error processing application: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/<path:filename>')
def serve_file(filename):
    return send_from_directory('.', filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)