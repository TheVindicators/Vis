import unittest, json, shutil
from flask import current_app
from app import create_app

class SaveStateTest(unittest.TestCase):

    def post_save(self, json_data):
        return self.client.post('/rest/save_state', data=json_data, content_type='application/json')

    def get_save(self, uuid):
        return self.client.get('/rest/resume_state/' + str(uuid))

    def setUp(self):
        self.longMessage = True
        self.app = create_app('testing')
        self.app_context = self.app.app_context()
        self.client = self.app.test_client()
        self.app_context.push()

    def tearDown(self):
        self.app_context.pop()
        #Ensuring working directory is always clean
        shutil.rmtree(self.app.config["JSON_STORE_DATA"])
        shutil.rmtree(self.app.config["FILE_CONVERSION_WORK_DIR"])

    def test_app_exists(self):
        print "\nTesting to see if Vis Server is running..."
        self.assertFalse(current_app is None)

    def test_app_is_testing(self):
        print "\nTesting to see if Vis Server is in testing mode..."
        self.assertEqual(current_app.config['MODE'], 'Testing')

    def test_bad_json_posting(self):
        print "\nTesting to see if Vis Server rejects invalid JSON save state..."
        test = {"Hello": 123}
        #Send the server garbage JSON data and see if it properly rejects it
        results = self.post_save(json.dumps(test))
        json_results = json.loads(results.get_data(as_text=True))
        self.assertNotEqual(results.status_code, 200)
        self.assertEqual(json_results["results"], "FAIL")
        self.assertEqual(json_results["reason"], "BADPOST")

    def test_good_json_with_uuid_posting(self):
        print "\nTesting to see if Vis Server properly saves a save state with an existing UUID..."
        results = None
        uuid = ""
        #Grab a valid save state and POST it to the server. Ensure feedback is as expected
        #(should be http response 200, API response with UUID and SUCCESS)
        with open('tests/resources/good_json_test.json', 'r') as json_file:
            state = json.load(json_file)
            uuid = state["project"]["uuid"]
            results = self.post_save(json.dumps(state))
        json_results = json.loads(results.get_data(as_text=True))
        self.assertEqual(results.status_code, 200)
        self.assertEqual(json_results["results"], "SUCCESS")
        self.assertEqual(json_results["uuid"], uuid)
        #Check to see if the saved state on disk has proper UUID.
        with open(self.app.config["JSON_STORE_DATA"] + str(uuid) + ".json", 'r') as json_file:
            state = json.load(json_file)
            uuid_test = state["project"]["uuid"]
            self.assertEqual(uuid, uuid_test)

    def test_good_json_without_uuid_posting(self):
        print "\nTesting to see if Vis Server properly saves a save state without an existing UUID (new state)..."
        results = None
        uuid = ""
        #Grab a valid save state, remove UUID, and POST it to the server. Ensure feedback is as expected
        #(should be http response 200, API response with UUID different than the original and SUCCESS)
        with open('tests/resources/good_json_test.json', 'r') as json_file:
            state = json.load(json_file)
            uuid = state["project"].pop("uuid")
            results = self.post_save(json.dumps(state))
        json_results = json.loads(results.get_data(as_text=True))
        self.assertEqual(results.status_code, 200)
        self.assertNotEqual(json_results["uuid"], uuid)
        #Check to see if the saved state on disk has proper UUID.
        with open(self.app.config["JSON_STORE_DATA"] + str(json_results["uuid"]) + ".json", 'r') as json_file:
            state = json.load(json_file)
            uuid_test = state["project"]["uuid"]
            self.assertEqual(json_results["uuid"], uuid_test)
