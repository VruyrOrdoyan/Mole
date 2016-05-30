using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Threading;
using System.Web.Script.Serialization;
using System.Collections;
using System.Xml.Serialization;
using System.IO;
using System.Text;
using System.Xml;

namespace Mole
{
    public partial class Index : System.Web.UI.Page
    {
        protected void Page_Load(object sender, EventArgs e)
        {
            //Thread.Sleep(1000);
            string taskStr = Request["ScrapData"];
            if (taskStr != null)
            {   
                try
                {
                    JavaScriptSerializer oSerializer = new JavaScriptSerializer();
                    Task task = oSerializer.Deserialize(taskStr, typeof(Task)) as Task;

                    Connector connector = new Connector(typeof(Task), string.Format("c:\\{0}.xml", task.TaskKey), true);

                    connector.Collection = task;

                    Response.Write(oSerializer.Serialize(task));
                    /*System.IO.StreamWriter file = new System.IO.StreamWriter(string.Format("c:\\{0}.txt", task.TaskKey));
                    file.WriteLine(taskStr);
                    file.Close();*/
                }
                catch (Exception ex) { 
                    
                    Response.Write("Error: " + ex.Message);
                }
                
            }
        }
    }
    
    public class Task
    {
        public string TaskKey { get; set; }
        public string File { get; set; }
        public string Channel { get; set; }
        public string Location { get; set; }
        public string DateFrom { get; set; }
        public string DateTo { get; set; }
        public List<Property> Properties { get; set; }
    }

    public class Property
    {
        public int Number { get; set; }
        public string Name { get; set; }
        public string PropDetURL { get; set; }
        public List<Room> Rooms { get; set; }
    }

    public class Room 
    {
        public string Name { get; set; }
    }

    public class Connector
    {
        #region fields
        /// <summary>
        /// The default XML file name (Path)
        /// This file contents in Bin folder
        /// </summary>
        public static string defaultXMLFilePath = "Collection.XML";
        /// <summary>
        /// The XML file name (Path)
        /// </summary>
        private string xmlFilePath = string.Empty;
        /// <summary>
        /// The last error message that happned
        /// during execution
        /// </summary>
        private string lastErrorMessage = string.Empty;
        /// <summary>
        /// The object tipe witch this class
        /// serialize to XML object
        /// </summary>
        private Type type = null;
        /// <summary>
        /// The object that XML file get
        /// Usually it was Implement ICollection
        /// interface
        /// </summary>
        private object collection;

        #endregion

        #region constructors
        /// <summary>
        /// Default constructor.
        /// It create Connection object 
        /// with default XML file name or path (DefaultXMLFilePath)
        /// </summary>
        /// <param name="type">
        /// The object type that serialize.
        /// Example: MyClass.Type
        /// </param>
        public Connector(Type type)
            : this(type, defaultXMLFilePath)
        { }

        /// <summary>
        /// Main constructor.
        /// This constructor create XML file with
        /// specific file path
        /// </summary>
        /// <param name="type">
        /// The object type that serialize.
        /// Example: MyClass.Type
        /// </param>
        /// <param name="xmlFilePath">
        /// XML file name or path
        /// Example: @C:\Folder1\Folder11
        /// </param>
        public Connector(Type type, string xmlFilePath)
        {
            this.xmlFilePath = xmlFilePath;
            this.type = type;
        }

        /// <summary>
        /// Main constructor.
        /// This constructor create XML file with
        /// Also it create empaty XML file
        /// </summary>
        /// <param name="type">
        /// The object type that serialize.
        /// Example: MyClass.Type
        /// </param>
        /// <param name="xmlFilePath">
        /// XML file name or path
        /// Example: @C:\Folder1\Folder11
        /// </param>
        /// <param name="isFileCreate">
        /// This boolian argument indicate
        /// are you wanting to create also XML empaty file
        /// or no
        /// (yes-true)
        /// (no-false)
        /// </param>
        public Connector(Type type, string xmlFilePath, bool isFileCreate)
            : this(type, xmlFilePath)
        {
            CreateFile(xmlFilePath, ref lastErrorMessage);
        }

        #endregion

        #region static methods
        /// <summary>
        /// This static function create empaty file.
        /// </summary>
        /// <param name="filePath">
        /// File path.
        /// Example: @C:\Folder1\Folder11\MyXmlFileName.xml
        /// </param>
        /// <param name="errorMessage">
        /// Last Error message that be during file creation
        /// The function retur false
        /// And can get error message 
        /// using LastErrorMessage properties
        /// </param>
        /// <returns>
        /// True if all is ok. 
        /// And No Error message create
        /// False if we have error
        /// Can get error message
        /// using LastErrorMessage properties
        /// </returns>
        public static bool CreateFile(string filePath, ref string errorMessage)
        {
            if (!File.Exists(filePath))
            {
                try
                {
                    FileStream fs = File.Create(filePath);
                    fs.Close();
                }
                catch (IOException ioEx)
                {
                    errorMessage = ioEx.Message;
                    return false;
                }
            }
            return true;
        }

        /// <summary>
        /// This static function delete the given file.
        /// </summary>
        /// <param name="filePath">
        /// Deleted file path.
        /// Example: @C:\Folder1\Folder11\MyXmlFileName.xml
        /// </param>
        public static void DeleteFile(string filePath)
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }
        #endregion

        #region private methods

        #region writer
        /// <summary>
        /// This function write XML file
        /// Attention: This function not creat additional file
        /// you can use this function if XML 
        /// file already created
        /// </summary>
        /// <param name="obj">
        /// The object that writed (serialized)
        /// to the XML file
        /// </param>
        /// <returns>
        /// True if all is ok. 
        /// And No Error message create
        /// False if we have error
        /// Can get error message
        /// using LastErrorMessage properties
        /// </returns>
        private bool WriteXmlObjects(Object obj)
        {
            if (File.Exists(xmlFilePath))
            {
                TextWriter writer = null;
                try
                {
                    XmlSerializer serializer = new XmlSerializer(type);
                    writer = new StreamWriter(xmlFilePath);
                    serializer.Serialize(writer, obj);
                    return true;
                }
                catch (Exception ex)
                {
                    lastErrorMessage = ex.Message;
                    return false;
                }
                finally
                {
                    if (writer != null)
                    {
                        writer.Close();
                    }
                }
            }
            else
            {
                lastErrorMessage = "File not exists.";
                return false;
            }
        }

        public string GetXmlStreeng(Object obj)
        {
            String strXml = null;
            XmlSerializer x = new XmlSerializer(type);
            MemoryStream memStream = new MemoryStream();
            XmlTextWriter xmlWriter = new XmlTextWriter(memStream, Encoding.UTF8);
            try
            {
                x.Serialize(xmlWriter, obj);
                memStream = (MemoryStream)xmlWriter.BaseStream;
                strXml = UTF8ByteArrayToString(memStream.ToArray());
                strXml = strXml.Substring(1);
            }
            catch (Exception ex)
            {
                lastErrorMessage = ex.Message;
            }
            xmlWriter.Close();
            memStream.Close();
            return strXml;
        }

        public object GetObject(string xmlStr)
        {
            XmlSerializer x = new XmlSerializer(type);
            MemoryStream memStream = new MemoryStream(StringToUTF8ByteArray(xmlStr));
            XmlTextReader xmlReader = new XmlTextReader(memStream);
            object obj = x.Deserialize(xmlReader);
            xmlReader.Close();
            memStream.Close();
            return obj;

        }

        private String UTF8ByteArrayToString(Byte[] characters)
        {

            UTF8Encoding encoding = new UTF8Encoding();
            String constructedString = encoding.GetString(characters);
            return (constructedString);
        }

        private Byte[] StringToUTF8ByteArray(String pXmlString)
        {
            UTF8Encoding encoding = new UTF8Encoding();
            Byte[] byteArray = encoding.GetBytes(pXmlString);
            return byteArray;
        }

        /// <summary>
        /// This function write XML file
        /// Attention: This function create additional file
        /// if this file is not created already
        /// If you use 
        /// "Connector(Type type, string xmlFilePath, bool isFileCreate)"
        /// constructor, not need to use this function
        /// </summary>
        /// <param name="obj">
        /// The object that writed (serialized)
        /// to the XML file
        /// </param>
        /// <param name="isFileCreate">
        /// This boolian argument indicate
        /// are you wanting to create also XML empaty file
        /// or no
        /// (yes-true)
        /// (no-false)
        /// </param>
        /// <returns>
        /// True if all is ok. 
        /// And No Error message create
        /// False if we have error
        /// Can get error message
        /// using LastErrorMessage properties
        /// </returns>
        private bool WriteXmlObjects(Object obj, bool isFileCreate)
        {
            if (isFileCreate)
            {
                if (!CreateFile(xmlFilePath, ref lastErrorMessage))
                {
                    return false;
                }
            }
            return WriteXmlObjects(obj);
        }
        #endregion

        #region read
        /// <summary>
        /// Read XML file and create object (collection).
        /// </summary>
        /// <returns>
        /// True if all is ok. 
        /// And No Error message create
        /// False if we have error
        /// Can get error message
        /// using LastErrorMessage properties
        /// </returns>
        private bool ReadXmlObjects()
        {
            if (File.Exists(xmlFilePath))
            {
                TextReader reader = null;
                try
                {
                    XmlSerializer serializer = new XmlSerializer(type);
                    reader = new StreamReader(xmlFilePath);
                    collection = (Object)serializer.Deserialize(reader);
                    return true;
                }
                catch (Exception ex)
                {
                    lastErrorMessage = ex.Message;
                    return false;
                }
                finally
                {
                    if (reader != null)
                    {
                        reader.Close();
                    }
                }
            }
            else
            {
                lastErrorMessage = "File not exists.";
                return false;
            }
        }

        #endregion

        #endregion

        #region properties
        /// <summary>
        /// Get/set XML file path.
        /// </summary>
        public string XmlFilePath
        {
            get
            {
                return xmlFilePath;
            }
            set
            {
                xmlFilePath = value;
            }
        }
        /// <summary>
        /// Get last error message.
        /// </summary>
        public string LastErrorMessage
        {
            get
            {
                return lastErrorMessage;
            }
        }

        /// <summary>
        /// Get and set object.
        /// </summary>
        public Object Collection
        {
            get
            {
                if (!ReadXmlObjects())
                {
                    throw new Exception(lastErrorMessage);
                }
                return collection;
            }
            set
            {
                if (!WriteXmlObjects(value))
                {
                    throw new Exception(lastErrorMessage);
                }
            }
        }
        #endregion

        
    }

    
}