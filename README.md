# Vis - Web Visualizer
A 3D WYSIWYG Visualizer to aid Northrop Grumman CEESIM operations

---

## What Is It?
Our program is an extension of the three.js development evironment modified to align with Northrop Grumman's Combat Magnetic Environment Simulator (CEESIM). Using this program you will be able to add, remove, and manipulate various antenna placements on a 3D aircraft model to simulate a realistic arrangment one might encounter in the field.

---

## How To Run

### For Users

If you're interested in trying out Vis yourself, please visit http://vis.ipwnage.com. From there, you'll be able to upload models, add antennas, and modify wireframe status easily.

### For Developers

If you're interested in contributing to Vis, or looking for deploy your own installation, setup is a breeze.

1. Clone the repository: `git clone https://github.com/TheVindicators/Vis.git`
2. Install Python2.7 for your respective operating system (https://www.python.org/download/releases/2.7/)
3. Install virtualenv (*nix/Mac: `sudo pip install virtualenv` Windows: `pip install virtualenv` )
4. Create a virtualenv in your Vis directory: `virtualenv venv`
5. Activate the virtualenv (*nix/Mac: `. venv/bin/activate` Windows: `venv\Scripts\activate.bat`)
6. Install all the requirements: `pip install -r requirements.txt`
7. Copy `config_sample.py` and name is `config.py`

That's it. To run the server, run `manage.py runserver`

If you're looking to deploy this for production use, it's recommended you use the uWSGI files in the `uwsgi` folder and deploy Vis as a service.

---

*Team: Nitin Garg, Christian Evans, David Lohle, and Joshua Waney*
