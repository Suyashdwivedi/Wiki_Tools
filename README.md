Here’s the modified version of your README.md for the **Wikimedia Supporting Tools** repository, following your instructions:

# Wikimedia Supporting Tools

This repository contains a set of tools developed to support Wikimedia-related activities, including scripts, automation, and enhancements that can streamline contributions to Wikimedia projects.

## Author

**Suyash Dwivedi**  
[User:Suyash.dwivedi](https://meta.wikimedia.org/wiki/User:Suyash.dwivedi)  

![Suyash Dwivedi](https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Suyash_Dwivedi_01%28cropped%29.jpg/180px-Suyash_Dwivedi_01%28cropped%29.jpg)  

## Tools and Features

- **MediaWiki API Integration**: Scripts that interact with MediaWiki for automation of common tasks such as uploading files, editing pages, and managing categories.
- **Content Management**: Tools to simplify bulk uploading, categorizing, and editing on Wikimedia Commons.
- **Wikidata Automation**: Scripts for automating data fetching, uploading, and updates on Wikidata.
- **Wikimedia Commons Tools**: Utilities for batch resizing, metadata editing, and optimizing images for Wikimedia Commons contributions.
- **Statistics Tracking**: Scripts to fetch user contributions, page views, and edit statistics for personal or project use.
- **Security & Compliance**: Tools that ensure contributions are compliant with Wikimedia policies, including licensing checks and attribution tools.

## Components

### 1. **MediaWiki Upload Tool**
   Automates the process of uploading files to Wikimedia Commons, with metadata handling and license validation.

### 2. **Wikidata Bot**
   Automates updates to Wikidata entries based on external data sources or predefined templates.

### 3. **Commons Metadata Editor**
   Allows bulk editing of metadata for files already uploaded to Wikimedia Commons, including batch license updates and category management.

### 4. **Statistics Tracker**
   Retrieves user contribution statistics for various Wikimedia projects, displaying edit counts, page views, and active contributions.

### 5. **Security Compliance Script**
   Verifies that all uploaded content adheres to Wikimedia’s licensing policies, including the use of proper attribution and copyright tags.

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Suyashdwivedi/Wiki_Tools.git
cd Wiki_Tools
```

### 2. Install Dependencies

Ensure you have Python 3 installed along with required dependencies listed in the `requirements.txt` file:

```bash
pip install -r requirements.txt
```

### 3. Configure MediaWiki Credentials

In each script requiring MediaWiki API access, update the configuration with your credentials:

```python
api_url = "https://www.your_wiki_instance.org/w/api.php"
username = "YourUsername"
password = "YourPassword"
```

### 4. Run the Scripts

After configuration, you can run the individual scripts based on the required function, such as:

```bash
python mediawiki_upload.py
python wikidata_update.py
```

## License

This project is licensed under the [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) license.
