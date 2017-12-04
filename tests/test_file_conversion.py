import unittest, json, shutil, glob, subprocess
from flask import current_app
from app import create_app

class FileConversionTest(unittest.TestCase):

    def post_file(self, file_data):
        return self.client.post('/rest/convert_object', data=file_data)

    def setUp(self):
        #self.longMessage = True bad idea for this test, since the output can kilobytes-worth of text
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

    def test_file_upload(self):
        print "\nTesting to see if Vis Server properly converts FLT to OBJ..."
        results = None
        with open('tests/resources/f35a.flt', 'r') as flt_file:
            results = self.post_file(flt_file.read())
        self.assertEqual(results.status_code, 200)
        #check to see if the server is properly saving the FLT file by comparing local .flt and server-side .flt
        with open(glob.glob(self.app.config["FILE_CONVERSION_WORK_DIR"] + "*.flt")[0]) as server_side_flt:
            with open('tests/resources/f35a.flt', 'r') as local_flt_file:
                self.assertEqual(server_side_flt.read(), local_flt_file.read())
        #check to see if the server is properly returning the converted file by comparing server-side obj and returned data from previous
        with open(glob.glob(self.app.config["FILE_CONVERSION_WORK_DIR"] + "*.obj")[0]) as server_side_obj:
            self.assertEqual(results.data, server_side_obj.read())

    def test_conversion_accuracy(self):
        print "\nTesting to see if Vis Server conversion is repeatable."
        results = None
        with open('tests/resources/f35a.flt', 'r') as flt_file:
            results = self.post_file(flt_file.read())
        self.assertEqual(results.status_code, 200)
        file_name = glob.glob(self.app.config["FILE_CONVERSION_WORK_DIR"] + "*.obj")[0]
        subprocess.call("osgconv tests/resources/f35a.flt " + file_name, shell=True)
        with open(file_name, 'r') as obj_file:
            self.assertEqual(results.data, obj_file.read())
